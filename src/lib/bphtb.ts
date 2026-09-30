import net from "net";
import { Client as SSHClient } from "ssh2";
import pg, { type PoolClient, type Pool } from "pg";
const { Pool: PgPool } = pg;

let pool: Pool | null = null;
let tunnelServer: net.Server | null = null;
let sshClient: SSHClient | null = null;
let activeTunnelPort: number | null = null;
let isTunnelInitializing = false;

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
  isTunnelInitializing = false;
}

/**
 * Membuat atau menggunakan kembali SSH Tunnel ke server PostgreSQL BPHTB
 */
function ensureSshTunnel(): Promise<TunnelInfo> {
  return new Promise((resolve, reject) => {
    if (activeTunnelPort && tunnelServer && sshClient) {
      return resolve({ port: activeTunnelPort });
    }

    if (isTunnelInitializing) {
      const checkInterval = setInterval(() => {
        if (activeTunnelPort) {
          clearInterval(checkInterval);
          resolve({ port: activeTunnelPort });
        }
      }, 200);
      return;
    }

    isTunnelInitializing = true;

    const sshHost = process.env.BPHTB_SSH_HOST || "103.167.12.53";
    const sshPort = parseInt(process.env.BPHTB_SSH_PORT || "22", 10);
    const sshUser = process.env.BPHTB_SSH_USER || "root";
    const rawPass = process.env.BPHTB_SSH_PASSWORD || "@#Tim1t42026";
    const sshPassword = rawPass === "@" ? "@#Tim1t42026" : rawPass.replace(/^["']|["']$/g, "").trim();
    const targetHost = process.env.BPHTB_DB_HOST || "192.168.1.101";
    const targetPort = parseInt(process.env.BPHTB_DB_PORT || "5432", 10);

    const ssh = new SSHClient();

    ssh.on("ready", () => {
      console.log(`[BPHTB SSH] ✅ Terhubung ke SSH Gateway: ${sshHost}:${sshPort}`);

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
        isTunnelInitializing = false;

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
}

/**
 * Inisialisasi PostgreSQL Connection Pool dengan dukungan SSH Tunnel
 */
export async function getBphtbPool(): Promise<Pool> {
  const isSshEnabled =
    process.env.BPHTB_SSH_ENABLED === "true" ||
    (!process.env.BPHTB_SSH_ENABLED && process.env.BPHTB_SSH_HOST);

  let targetHost = process.env.BPHTB_DB_HOST || "192.168.1.101";
  let targetPort = parseInt(process.env.BPHTB_DB_PORT || "5432", 10);

  if (isSshEnabled) {
    const tunnel = await ensureSshTunnel();
    targetHost = "127.0.0.1";
    targetPort = tunnel.port;
  }

  if (!pool) {
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
  }

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
  LUASTANAH: number | string;
  LUASBANGUNAN: number | string;
  PEMBAYARAN: number | string;
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

  const database = process.env.BPHTB_DB_NAME || "dbbphtb";
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
      LUASTANAH: row.luas_bumi ?? 0,
      LUASBANGUNAN: row.luas_bangunan ?? 0,
      PEMBAYARAN: row.nilai_belum_dibayar ?? 0,
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

    let customMessage = error.message || "Terjadi kesalahan saat menghubungi basis data PostgreSQL BPHTB";

    if (error.message?.includes("timeout") || error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED" || error.code === "EHOSTUNREACH") {
      customMessage = `Gagal terhubung ke Database PostgreSQL BPHTB (${process.env.BPHTB_DB_HOST || "192.168.1.101"}:5432). Periksa koneksi SSH Tunnel ke ${process.env.BPHTB_SSH_HOST || "103.167.12.53"}.`;
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

