import net from "net";
import os from "os";
import { Client as SSHClient } from "ssh2";
import pg, { type PoolClient, type Pool } from "pg";
const { Pool: PgPool } = pg;

let pool: Pool | null = null;
let tunnelServer: net.Server | null = null;
let sshClient: SSHClient | null = null;
let activeTunnelPort: number | null = null;
let tunnelPromise: Promise<TunnelInfo> | null = null;

interface TunnelInfo {
  port: number;
}

function cleanupTunnel() {
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
  if (tunnelServer) {
    try {
      tunnelServer.close();
    } catch (_) {}
    tunnelServer = null;
  }
  if (sshClient) {
    try {
      sshClient.end();
    } catch (_) {}
    sshClient = null;
  }
  activeTunnelPort = null;
  tunnelPromise = null;
}

/**
 * Cek apakah host database adalah IP milik mesin ini sendiri (misal saat aplikasi berjalan langsung di server 192.168.1.101)
 */
function isSameMachineHost(host: string): boolean {
  if (host === "127.0.0.1" || host === "localhost" || host === "::1") {
    return true;
  }
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.address === host) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Membuat atau menggunakan kembali SSH Tunnel (via Tailscale / Gateway) ke server PostgreSQL BPHTB
 */
function ensureSshTunnel(): Promise<TunnelInfo> {
  if (activeTunnelPort && tunnelServer && sshClient) {
    return Promise.resolve({ port: activeTunnelPort });
  }

  if (tunnelPromise) {
    return tunnelPromise;
  }

  tunnelPromise = new Promise<TunnelInfo>((resolve, reject) => {
    const sshHost = process.env.BPHTB_SSH_HOST || "100.108.177.13";
    const sshPort = parseInt(process.env.BPHTB_SSH_PORT || "2201", 10);
    const sshUser = process.env.BPHTB_SSH_USER || "hnf";
    const rawPass = process.env.BPHTB_SSH_PASSWORD || "@programmer";
    const cleanedPass = rawPass.replace(/^["']|["']$/g, "").trim();
    const sshPassword =
      cleanedPass === "@" || cleanedPass === "#" || cleanedPass === "@#Tim1t42026" || !cleanedPass
        ? "@programmer"
        : cleanedPass;
    const targetHost = process.env.BPHTB_DB_HOST || "192.168.1.101";
    const targetPort = parseInt(process.env.BPHTB_DB_PORT || "5432", 10);

    const ssh = new SSHClient();

    ssh.on("ready", () => {
      console.log(`[BPHTB SSH] ✅ Terhubung ke SSH Tailscale/Gateway: ${sshUser}@${sshHost}:${sshPort}`);

      const server = net.createServer((sock) => {
        sock.on("error", (err) => {
          console.error("[BPHTB SSH Sock] Socket error:", err.message);
        });

        try {
          ssh.forwardOut(
            sock.remoteAddress || "127.0.0.1",
            sock.remotePort || 0,
            targetHost,
            targetPort,
            (err, stream) => {
              if (err) {
                console.error("[BPHTB SSH] Forward stream error:", err.message);
                sock.destroy();
                cleanupTunnel();
                return;
              }
              sock.pipe(stream);
              stream.pipe(sock);

              stream.on("error", (sErr) => {
                console.error("[BPHTB SSH] Stream error:", sErr.message);
                sock.destroy();
              });

              stream.on("close", () => {
                sock.destroy();
              });
            }
          );
        } catch (fwdErr: any) {
          console.error("[BPHTB SSH] forwardOut uncaught error:", fwdErr?.message);
          sock.destroy();
          cleanupTunnel();
        }
      });

      server.listen(0, "127.0.0.1", () => {
        const address = server.address() as net.AddressInfo;
        activeTunnelPort = address.port;
        tunnelServer = server;
        sshClient = ssh;
        tunnelPromise = null;

        console.log(
          `[BPHTB SSH] ✅ Tunnel aktif di 127.0.0.1:${activeTunnelPort} -> ${targetHost}:${targetPort}`
        );
        resolve({ port: activeTunnelPort });
      });

      server.on("error", (err) => {
        console.error("[BPHTB SSH] Server error:", err);
        cleanupTunnel();
        reject(err);
      });
    });

    ssh.on("error", (err) => {
      console.error("[BPHTB SSH] Client connection error:", err.message);
      cleanupTunnel();
      reject(err);
    });

    ssh.on("close", () => {
      console.log("[BPHTB SSH] Connection closed.");
      cleanupTunnel();
    });

    ssh.on("end", () => {
      console.log("[BPHTB SSH] Connection ended.");
      cleanupTunnel();
    });

    ssh.connect({
      host: sshHost,
      port: sshPort,
      username: sshUser,
      password: sshPassword,
      readyTimeout: 15000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
    });
  });

  return tunnelPromise;
}

/**
 * Inisialisasi PostgreSQL Connection Pool dengan dukungan koneksi lokal (di VM) & SSH Tunnel Tailscale (dari luar VM)
 */
export async function getBphtbPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const configuredHost = process.env.BPHTB_DB_HOST || "192.168.1.101";
  const configuredPort = parseInt(process.env.BPHTB_DB_PORT || "5432", 10);
  const isSshForcedOff = process.env.BPHTB_SSH_ENABLED === "false";
  const isSshConfigured =
    !isSshForcedOff &&
    (process.env.BPHTB_SSH_ENABLED === "true" || Boolean(process.env.BPHTB_SSH_HOST));

  let targetHost = configuredHost;
  let targetPort = configuredPort;

  // Jika aplikasi berjalan langsung di mesin server database (192.168.1.101), gunakan koneksi lokal tanpa SSH tunnel
  if (isSameMachineHost(configuredHost)) {
    targetHost = "127.0.0.1";
    targetPort = configuredPort;
  } else if (isSshConfigured) {
    const tunnel = await ensureSshTunnel();
    targetHost = "127.0.0.1";
    targetPort = tunnel.port;
  }

  const database = process.env.BPHTB_DB_NAME || "dbbphtb";
  const user = process.env.BPHTB_DB_USER || "postgres";
  const password = process.env.BPHTB_DB_PASSWORD || "rahasia";

  pool = new PgPool({
    host: targetHost,
    port: targetPort,
    database,
    user,
    password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error("[BPHTB Postgres] Unexpected error on idle client:", err);
    cleanupTunnel();
  });

  return pool;
}

export interface BphtbQueryResult {
  NOP: string;
  NIK: string;
  NAMA: string;
  ALAMAT: string;
  KELURAHAN_OP: string;
  KECAMATAN_OP: string;
  KOTA_OP: string;
  LUASTANAH: number;
  LUASBANGUNAN: number;
  PEMBAYARAN: number;
  STATUS: string;
  TANGGAL_PEMBAYARAN: string;
  NTPD: string;
  JENISBAYAR: string;
}

export interface BphtbResponse {
  result: BphtbQueryResult | null;
  message?: string;
}

/**
 * Format tanggal ke format standar d/m/Y (DD/MM/YYYY)
 */
function formatDate(dateVal: any): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    return String(dateVal);
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Query data BPHTB berdasarkan NOP dan NTPD / No STS
 */
export async function queryBphtb(nop: string, ntpd: string): Promise<BphtbResponse> {
  const cleanNop = (nop || "").trim();
  const cleanNtpd = (ntpd || "").trim();

  if (!cleanNop || !cleanNtpd) {
    return {
      result: null,
      message: "Parameter NOP dan NTPD (No STS) wajib diisi.",
    };
  }

  let client: PoolClient | null = null;

  try {
    const pgPool = await getBphtbPool();
    client = await pgPool.connect();

    const query = `
      SELECT *,
        CASE WHEN CAST(status_bayar AS VARCHAR) = '1' THEN 'Y' ELSE 'T' END AS status,
        CASE WHEN CAST(status_bayar AS VARCHAR) = '1' THEN 'L' ELSE 'H' END AS jenisbayar
      FROM tbl_bphtb
      WHERE (nop = $1 OR REPLACE(REPLACE(nop, '.', ''), '-', '') = $1)
        AND (no_sts = $2 OR CAST(no_sts AS VARCHAR) = $2)
      LIMIT 1
    `;

    const res = await client.query(query, [cleanNop, cleanNtpd]);

    if (res.rows.length === 0) {
      return {
        result: null,
        message: "Data tidak ditemukan",
      };
    }

    const row = res.rows[0];
    const nilaiBelumDibayar = Number(row.nilai_belum_dibayar ?? 0);

    const formattedResult: BphtbQueryResult = {
      NOP: row.nop ?? cleanNop,
      NIK: row.nik ?? "",
      NAMA: row.nama_wp_baru ?? row.nama_wp ?? "",
      ALAMAT: row.alamat_wp_baru ?? row.alamat_wp ?? row.lokasi_op ?? "",
      KELURAHAN_OP: row.kelurahan_op ?? "",
      KECAMATAN_OP: row.kecamatan_op ?? "",
      KOTA_OP: row.kota_op ?? "",
      LUASTANAH: Number(row.luas_bumi ?? 0),
      LUASBANGUNAN: Number(row.luas_bangunan ?? 0),
      PEMBAYARAN: Number(row.bphtb ?? 0),
      STATUS: "",
      TANGGAL_PEMBAYARAN: "",
      NTPD: row.no_sts ?? cleanNtpd,
      JENISBAYAR: "",
    };

    if (nilaiBelumDibayar < 1) {
      formattedResult.STATUS = "Y";
      formattedResult.TANGGAL_PEMBAYARAN = formatDate(row.tgl_skp);
      formattedResult.NTPD = row.no_sts ?? cleanNtpd;
      formattedResult.JENISBAYAR = "L";
    } else {
      formattedResult.STATUS = row.status ?? "T";
      formattedResult.TANGGAL_PEMBAYARAN = formatDate(row.tgl_bayar);
      formattedResult.NTPD = row.no_sts ?? cleanNtpd;
      formattedResult.JENISBAYAR = row.jenisbayar ?? "H";
    }

    return {
      result: formattedResult,
    };
  } catch (error: any) {
    console.error("Error executing queryBphtb:", error);
    cleanupTunnel();

    let customMessage = error.message || "Terjadi kesalahan saat menghubungi basis data PostgreSQL BPHTB";

    if (
      error.message?.includes("timeout") ||
      error.message?.includes("Timed out") ||
      error.code === "ETIMEDOUT" ||
      error.code === "ECONNREFUSED" ||
      error.code === "EHOSTUNREACH"
    ) {
      customMessage = `Gagal terhubung ke Database PostgreSQL BPHTB (${process.env.BPHTB_DB_HOST || "192.168.1.101"}:5432). Periksa koneksi SSH Tunnel Tailscale ke ${process.env.BPHTB_SSH_HOST || "100.108.177.13"}:${process.env.BPHTB_SSH_PORT || "2201"}.`;
    }

    return {
      result: null,
      message: customMessage,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}
