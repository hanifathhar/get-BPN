import oracledb from "oracledb";
import path from "path";
import fs from "fs";

// Inisialisasi Oracle Thick Client
let isOracleClientInitialized = false;

export function ensureOracleClient() {
  if (!isOracleClientInitialized) {
    try {
      if (process.platform === "win32") {
        const libDir = path.resolve(process.cwd(), "oracle_client", "instantclient_19_23");
        if (!process.env.PATH?.includes(libDir)) {
          process.env.PATH = `${libDir};${process.env.PATH}`;
        }
        oracledb.initOracleClient({ libDir });
      } else {
        // Linux / Unix environment: cari direktori Oracle Instant Client
        const candidateDirs = [
          process.env.ORACLE_CLIENT_DIR,
          "/opt/oracle/instantclient_19_23",
          "/opt/oracle/instantclient_21_13",
          "/opt/oracle/instantclient",
          "/usr/lib/oracle/19.23/client64/lib",
          "/usr/lib/oracle/21/client64/lib",
        ].filter(Boolean) as string[];

        const foundDir = candidateDirs.find((dir) => fs.existsSync(dir));
        if (foundDir) {
          oracledb.initOracleClient({ libDir: foundDir });
        } else {
          // Coba inisialisasi default sistem (LD_LIBRARY_PATH / ldconfig)
          oracledb.initOracleClient();
        }
      }
      isOracleClientInitialized = true;
    } catch (err: any) {
      // Abaikan jika sudah diinisialisasi sebelumnya
      if (err.message && (err.message.includes("already been initialized") || err.message.includes("NJS-077"))) {
        isOracleClientInitialized = true;
      } else {
        console.warn("Oracle client initialization note:", err.message);
      }
    }
  }
}

/**
 * Helper validasi & parsing 18 Digit NOP SISMIOP
 */
export function parseNop(nopRaw: string) {
  const nopClean = (nopRaw || "").replace(/\D/g, "");

  if (nopClean.length !== 18) {
    throw new Error("Format NOP harus 18 digit angka standar SISMIOP PBB.");
  }

  return {
    raw: nopRaw,
    clean: nopClean,
    formatted: `${nopClean.substring(0, 2)}.${nopClean.substring(2, 4)}.${nopClean.substring(4, 7)}.${nopClean.substring(7, 10)}.${nopClean.substring(10, 13)}-${nopClean.substring(13, 17)}.${nopClean.substring(17, 18)}`,
    kd_propinsi: nopClean.substring(0, 2),
    kd_dati2: nopClean.substring(2, 4),
    kd_kecamatan: nopClean.substring(4, 7),
    kd_kelurahan: nopClean.substring(7, 10),
    kd_blok: nopClean.substring(10, 13),
    no_urut: nopClean.substring(13, 17),
    kd_jns_op: nopClean.substring(17, 18),
  };
}

/**
 * Mengambil koneksi database Oracle SISMIOP
 */
export async function getDbConnection() {
  ensureOracleClient();
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

  const host = process.env.DB_HOST || "103.167.12.59";
  const port = process.env.DB_PORT || "1521";
  const sid = process.env.DB_SID || "SISMIOP";
  const user = process.env.DB_USER || "PBB";
  const password = process.env.DB_PASSWORD || "PBB";

  return await oracledb.getConnection({
    user,
    password,
    connectString: `${host}:${port}/${sid}`,
  });
}

/**
 * Driver SISMIOP PBB: Query langsung ke Oracle Database
 */
export async function querySismiop(
  action: "health" | "detail_nop" | "sppt",
  nop?: string
) {
  let conn;
  try {
    conn = await getDbConnection();

    if (action === "health") {
      await conn.execute("SELECT 1 FROM DUAL");
      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Koneksi database Oracle SISMIOP aktif dan sehat.",
        data: {
          database: "Oracle SISMIOP PBB",
          timestamp: new Date().toISOString(),
        },
      };
    }

    if (!nop) {
      throw new Error("Parameter NOP dibutuhkan untuk aksi ini.");
    }

    const p = parseNop(nop);
    const bindParams = {
      kd_propinsi: p.kd_propinsi,
      kd_dati2: p.kd_dati2,
      kd_kecamatan: p.kd_kecamatan,
      kd_kelurahan: p.kd_kelurahan,
      kd_blok: p.kd_blok,
      no_urut: p.no_urut,
      kd_jns_op: p.kd_jns_op,
    };

    if (action === "detail_nop") {
      const sql = `
        SELECT 
          A.KD_PROPINSI||A.KD_DATI2||A.KD_KECAMATAN||A.KD_KELURAHAN||A.KD_BLOK||A.NO_URUT||A.KD_JNS_OP AS NOP,
          B.NM_WP,
          A.JALAN_OP AS ALAMAT_OP,
          C.NM_KECAMATAN AS KECAMATAN_OP,
          D.NM_KELURAHAN AS KELURAHAN_OP,
          '' AS KOTA_OP,
          A.TOTAL_LUAS_BUMI AS LUASTANAH_OP,
          A.TOTAL_LUAS_BNG AS LUASBANGUNAN_OP,
          A.NJOP_BUMI AS NJOP_TANAH_OP,
          A.NJOP_BNG AS NJOP_BANGUNAN_OP
        FROM PBB.DAT_OBJEK_PAJAK A 
        LEFT JOIN PBB.DAT_SUBJEK_PAJAK B ON A.SUBJEK_PAJAK_ID=B.SUBJEK_PAJAK_ID
        LEFT JOIN PBB.REF_KECAMATAN C ON A.KD_PROPINSI=C.KD_PROPINSI AND A.KD_DATI2=C.KD_DATI2 AND A.KD_KECAMATAN=C.KD_KECAMATAN
        LEFT JOIN PBB.REF_KELURAHAN D ON A.KD_PROPINSI=D.KD_PROPINSI AND A.KD_DATI2=D.KD_DATI2 AND A.KD_KECAMATAN=D.KD_KECAMATAN AND A.KD_KELURAHAN=D.KD_KELURAHAN
        WHERE A.KD_PROPINSI=:kd_propinsi 
          AND A.KD_DATI2=:kd_dati2 
          AND A.KD_KECAMATAN=:kd_kecamatan 
          AND A.KD_KELURAHAN=:kd_kelurahan 
          AND A.KD_BLOK=:kd_blok 
          AND A.NO_URUT=:no_urut 
          AND A.KD_JNS_OP=:kd_jns_op
      `;

      const result: any = await conn.execute(sql, bindParams);

      if (!result.rows || result.rows.length === 0) {
        return {
          status: "NOT_FOUND",
          statusCode: 404,
          message: `Data Objek Pajak dengan NOP ${p.formatted} tidak ditemukan di database SISMIOP.`,
          data: null,
        };
      }

      const row = result.rows[0];
      const njopTanah = Number(row.NJOP_TANAH_OP) || 0;
      const njopBng = Number(row.NJOP_BANGUNAN_OP) || 0;

      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Data Objek Pajak berhasil ditemukan.",
        data: {
          nop: p.formatted,
          nop_raw: p.clean,
          nm_wp: row.NM_WP || "-",
          alamat_op: row.ALAMAT_OP || "-",
          kecamatan_op: row.KECAMATAN_OP || "-",
          kelurahan_op: row.KELURAHAN_OP || "-",
          kota_op: row.KOTA_OP || "-",
          luastanah_op: Number(row.LUASTANAH_OP) || 0,
          luasbangunan_op: Number(row.LUASBANGUNAN_OP) || 0,
          njop_tanah_op: njopTanah,
          njop_bangunan_op: njopBng,
          total_njop: njopTanah + njopBng,
        },
      };
    }

    if (action === "sppt") {
      const spptSql = `
        SELECT 
          THN_PAJAK_SPPT, 
          PBB_YG_HARUS_DIBAYAR_SPPT, 
          STATUS_PEMBAYARAN_SPPT, 
          TGL_TERBIT_SPPT, 
          TGL_JATUH_TEMPO_SPPT
        FROM PBB.SPPT
        WHERE KD_PROPINSI=:kd_propinsi 
          AND KD_DATI2=:kd_dati2 
          AND KD_KECAMATAN=:kd_kecamatan 
          AND KD_KELURAHAN=:kd_kelurahan 
          AND KD_BLOK=:kd_blok 
          AND NO_URUT=:no_urut 
          AND KD_JNS_OP=:kd_jns_op
        ORDER BY THN_PAJAK_SPPT DESC
      `;

      const paymentSql = `
        SELECT 
          THN_PAJAK_SPPT, 
          PEMBAYARAN_SPPT_KE, 
          JML_SPPT_YG_DIBAYAR, 
          DENDA_SPPT, 
          TGL_PEMBAYARAN_SPPT
        FROM PBB.PEMBAYARAN_SPPT
        WHERE KD_PROPINSI=:kd_propinsi 
          AND KD_DATI2=:kd_dati2 
          AND KD_KECAMATAN=:kd_kecamatan 
          AND KD_KELURAHAN=:kd_kelurahan 
          AND KD_BLOK=:kd_blok 
          AND NO_URUT=:no_urut 
          AND KD_JNS_OP=:kd_jns_op
        ORDER BY THN_PAJAK_SPPT DESC
      `;

      const [spptRes, paymentRes]: [any, any] = await Promise.all([
        conn.execute(spptSql, bindParams),
        conn.execute(paymentSql, bindParams),
      ]);

      const paymentsByYear = new Map<string, any[]>();
      if (paymentRes.rows) {
        for (const pay of paymentRes.rows) {
          const yr = String(pay.THN_PAJAK_SPPT);
          if (!paymentsByYear.has(yr)) {
            paymentsByYear.set(yr, []);
          }
          paymentsByYear.get(yr)!.push({
            pembayaran_ke: pay.PEMBAYARAN_SPPT_KE,
            jumlah_dibayar: Number(pay.JML_SPPT_YG_DIBAYAR) || 0,
            denda: Number(pay.DENDA_SPPT) || 0,
            tgl_pembayaran: pay.TGL_PEMBAYARAN_SPPT ? new Date(pay.TGL_PEMBAYARAN_SPPT).toISOString().split("T")[0] : null,
          });
        }
      }

      let totalTunggakan = 0;
      let totalKetetapan = 0;

      const spptList = (spptRes.rows || []).map((row: any) => {
        const tahun = String(row.THN_PAJAK_SPPT);
        const pbbHarusDibayar = Number(row.PBB_YG_HARUS_DIBAYAR_SPPT) || 0;
        const isLunas = String(row.STATUS_PEMBAYARAN_SPPT) === "1" || String(row.STATUS_PEMBAYARAN_SPPT) === "2";
        
        totalKetetapan += pbbHarusDibayar;
        if (!isLunas) {
          totalTunggakan += pbbHarusDibayar;
        }

        return {
          tahun_pajak: tahun,
          pbb_terhutang: pbbHarusDibayar,
          status_pembayaran: isLunas ? "LUNAS" : "BELUM LUNAS",
          status_code: row.STATUS_PEMBAYARAN_SPPT,
          tgl_terbit: row.TGL_TERBIT_SPPT ? new Date(row.TGL_TERBIT_SPPT).toISOString().split("T")[0] : null,
          tgl_jatuh_tempo: row.TGL_JATUH_TEMPO_SPPT ? new Date(row.TGL_JATUH_TEMPO_SPPT).toISOString().split("T")[0] : null,
          riwayat_pembayaran: paymentsByYear.get(tahun) || [],
        };
      });

      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Data SPPT & Ketetapan PBB berhasil ditemukan.",
        data: {
          nop: p.formatted,
          nop_raw: p.clean,
          ringkasan: {
            total_tahun_tercatat: spptList.length,
            total_ketetapan: totalKetetapan,
            total_tunggakan: totalTunggakan,
            status_keseluruhan: totalTunggakan === 0 && spptList.length > 0 ? "LUNAS_SEMUA" : "ADA_TUNGGAKAN",
          },
          sppt: spptList,
        },
      };
    }

    throw new Error(`Aksi '${action}' tidak didukung.`);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
}
