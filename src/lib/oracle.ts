import oracledb from "oracledb";
import path from "path";
import fs from "fs";

// Inisialisasi Oracle Thick Client
let isOracleClientInitialized = false;


export function ensureOracleClient() {
  if (!isOracleClientInitialized) {
    try {
      if (process.platform === "win32") {
        const libDir = path.resolve(
          process.cwd(),
          "oracle_client",
          "instantclient_19_23"
        );

        if (!process.env.PATH?.includes(libDir)) {
          process.env.PATH = `${libDir};${process.env.PATH}`;
        }

        oracledb.initOracleClient({ libDir });
      } else {
        // Linux / Unix
        const libDir =
          process.env.ORACLE_CLIENT_DIR ||
          "/opt/oracle/instantclient_19_23";

        if (!fs.existsSync(libDir)) {
          throw new Error(
            `Oracle Instant Client tidak ditemukan: ${libDir}`
          );
        }

        console.log("Oracle Client Directory:", libDir);

        oracledb.initOracleClient({
          libDir,
        });

        console.log(
          "Oracle Thick Mode:",
          !oracledb.thin
        );

        console.log(
          "Oracle Client Version:",
          oracledb.oracleClientVersionString
        );
      }

      isOracleClientInitialized = true;
    } catch (err: any) {
      if (
        err.message &&
        (
          err.message.includes("already been initialized") ||
          err.message.includes("NJS-077")
        )
      ) {
        isOracleClientInitialized = true;
      } else {
        console.error(
          "Oracle client initialization error:",
          err
        );

        throw err;
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

  const connectString = `(DESCRIPTION=(CONNECT_TIMEOUT=15)(RETRY_COUNT=3)(ADDRESS=(PROTOCOL=TCP)(HOST=${host})(PORT=${port}))(CONNECT_DATA=(SID=${sid})))`;

  return await oracledb.getConnection({
    user,
    password,
    connectString,
  });
}

/**
 * Driver SISMIOP PBB: Query langsung ke Oracle Database
 */
export async function querySismiop(
  action: "health" | "detail_nop" | "sppt" | "znt",
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

    if (action === "znt") {
      const zntSql = `
        SELECT 
          A.KD_PROPINSI||A.KD_DATI2||A.KD_KECAMATAN||A.KD_KELURAHAN||A.KD_BLOK||A.NO_URUT||A.KD_JNS_OP AS NOP,
          A.KD_PROPINSI,
          A.KD_DATI2,
          A.KD_KECAMATAN,
          C.NM_KECAMATAN,
          A.KD_KELURAHAN,
          D.NM_KELURAHAN,
          A.KD_BLOK,
          A.NO_URUT,
          A.KD_JNS_OP,
          A.JALAN_OP AS ALAMAT_OP,
          A.TOTAL_LUAS_BUMI,
          A.NJOP_BUMI,
          B.NM_WP,
          OB.NO_BUMI,
          OB.KD_ZNT,
          OB.LUAS_BUMI,
          OB.JNS_BUMI,
          OB.NILAI_SISTEM_BUMI,
          Z.NIR,
          Z.THN_NIR_ZNT
        FROM PBB.DAT_OBJEK_PAJAK A
        LEFT JOIN PBB.DAT_SUBJEK_PAJAK B ON A.SUBJEK_PAJAK_ID=B.SUBJEK_PAJAK_ID
        LEFT JOIN PBB.REF_KECAMATAN C ON A.KD_PROPINSI=C.KD_PROPINSI AND A.KD_DATI2=C.KD_DATI2 AND A.KD_KECAMATAN=C.KD_KECAMATAN
        LEFT JOIN PBB.REF_KELURAHAN D ON A.KD_PROPINSI=D.KD_PROPINSI AND A.KD_DATI2=D.KD_DATI2 AND A.KD_KECAMATAN=D.KD_KECAMATAN AND A.KD_KELURAHAN=D.KD_KELURAHAN
        LEFT JOIN PBB.DAT_OP_BUMI OB ON A.KD_PROPINSI=OB.KD_PROPINSI 
          AND A.KD_DATI2=OB.KD_DATI2 
          AND A.KD_KECAMATAN=OB.KD_KECAMATAN 
          AND A.KD_KELURAHAN=OB.KD_KELURAHAN 
          AND A.KD_BLOK=OB.KD_BLOK 
          AND A.NO_URUT=OB.NO_URUT 
          AND A.KD_JNS_OP=OB.KD_JNS_OP
        LEFT JOIN (
          SELECT KD_PROPINSI, KD_DATI2, KD_KECAMATAN, KD_KELURAHAN, KD_ZNT, NIR, THN_NIR_ZNT,
                 ROW_NUMBER() OVER (PARTITION BY KD_PROPINSI, KD_DATI2, KD_KECAMATAN, KD_KELURAHAN, KD_ZNT ORDER BY THN_NIR_ZNT DESC) as RN
          FROM PBB.DAT_NIR
        ) Z ON OB.KD_PROPINSI=Z.KD_PROPINSI 
          AND OB.KD_DATI2=Z.KD_DATI2 
          AND OB.KD_KECAMATAN=Z.KD_KECAMATAN 
          AND OB.KD_KELURAHAN=Z.KD_KELURAHAN 
          AND OB.KD_ZNT=Z.KD_ZNT
          AND Z.RN = 1
        WHERE A.KD_PROPINSI=:kd_propinsi 
          AND A.KD_DATI2=:kd_dati2 
          AND A.KD_KECAMATAN=:kd_kecamatan 
          AND A.KD_KELURAHAN=:kd_kelurahan 
          AND A.KD_BLOK=:kd_blok 
          AND A.NO_URUT=:no_urut 
          AND A.KD_JNS_OP=:kd_jns_op
        ORDER BY OB.NO_BUMI ASC
      `;

      const result: any = await conn.execute(zntSql, bindParams);

      if (!result.rows || result.rows.length === 0) {
        return {
          status: "NOT_FOUND",
          statusCode: 404,
          message: `Data ZNT Objek Pajak dengan NOP ${p.formatted} tidak ditemukan di database SISMIOP.`,
          data: null,
        };
      }

      const first = result.rows[0];
      const totalLuasBumi = Number(first.TOTAL_LUAS_BUMI) || 0;
      const totalNjopBumi = Number(first.NJOP_BUMI) || 0;
      const njopPerM2 = totalLuasBumi > 0 ? Math.round(totalNjopBumi / totalLuasBumi) : 0;

      const rincianBumi = result.rows
        .filter((r: any) => r.NO_BUMI !== null)
        .map((r: any) => {
          const luas = Number(r.LUAS_BUMI) || 0;
          const nilaiSistem = Number(r.NILAI_SISTEM_BUMI) || 0;
          const nirVal = Number(r.NIR) || 0;
          return {
            no_bumi: r.NO_BUMI,
            kd_znt: r.KD_ZNT || "-",
            nir: nirVal,
            nir_rupiah: nirVal > 0 ? nirVal * 1000 : null,
            tahun_nir: r.THN_NIR_ZNT || null,
            luas_bumi: luas,
            jns_bumi: r.JNS_BUMI || "-",
            nilai_sistem_bumi: nilaiSistem,
            estimasi_nilai_per_m2: luas > 0 ? Math.round(nilaiSistem / luas) : 0,
          };
        });

      return {
        status: "SUCCESS",
        statusCode: 200,
        message: "Data Zona Nilai Tanah (ZNT) berhasil ditemukan.",
        data: {
          nop: p.formatted,
          nop_raw: p.clean,
          nama_wp: first.NM_WP || "-",
          alamat_op: first.ALAMAT_OP || "-",
          wilayah: {
            kd_propinsi: first.KD_PROPINSI,
            kd_dati2: first.KD_DATI2,
            kd_kecamatan: first.KD_KECAMATAN,
            nm_kecamatan: first.NM_KECAMATAN || "-",
            kd_kelurahan: first.KD_KELURAHAN,
            nm_kelurahan: first.NM_KELURAHAN || "-",
            kd_blok: first.KD_BLOK,
          },
          rekap_bumi: {
            total_luas_bumi: totalLuasBumi,
            total_njop_bumi: totalNjopBumi,
            rata_rata_njop_per_m2: njopPerM2,
            kode_znt_utama: rincianBumi[0]?.kd_znt || "-",
            nir_utama: rincianBumi[0]?.nir || 0,
            nir_utama_rupiah: rincianBumi[0]?.nir_rupiah || null,
            tahun_nir_utama: rincianBumi[0]?.tahun_nir || null,
          },
          rincian_zona_nilai_tanah: rincianBumi,
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

/**
 * Query daftar master ZNT per wilayah (Kecamatan / Kelurahan)
 */
export async function queryZntWilayah(filter: {
  kd_propinsi?: string;
  kd_dati2?: string;
  kd_kecamatan?: string;
  kd_kelurahan?: string;
  kd_znt?: string;
  limit?: number;
}) {
  let conn;
  try {
    conn = await getDbConnection();

    let sql = `
      SELECT 
        Z.KD_PROPINSI,
        Z.KD_DATI2,
        Z.KD_KECAMATAN,
        C.NM_KECAMATAN,
        Z.KD_KELURAHAN,
        D.NM_KELURAHAN,
        Z.KD_ZNT,
        N.NIR,
        N.THN_NIR_ZNT
      FROM PBB.DAT_ZNT Z
      LEFT JOIN PBB.REF_KECAMATAN C ON Z.KD_PROPINSI=C.KD_PROPINSI AND Z.KD_DATI2=C.KD_DATI2 AND Z.KD_KECAMATAN=C.KD_KECAMATAN
      LEFT JOIN PBB.REF_KELURAHAN D ON Z.KD_PROPINSI=D.KD_PROPINSI AND Z.KD_DATI2=D.KD_DATI2 AND Z.KD_KECAMATAN=D.KD_KECAMATAN AND Z.KD_KELURAHAN=D.KD_KELURAHAN
      LEFT JOIN (
        SELECT KD_PROPINSI, KD_DATI2, KD_KECAMATAN, KD_KELURAHAN, KD_ZNT, NIR, THN_NIR_ZNT,
               ROW_NUMBER() OVER (PARTITION BY KD_PROPINSI, KD_DATI2, KD_KECAMATAN, KD_KELURAHAN, KD_ZNT ORDER BY THN_NIR_ZNT DESC) as RN
        FROM PBB.DAT_NIR
      ) N ON Z.KD_PROPINSI=N.KD_PROPINSI 
        AND Z.KD_DATI2=N.KD_DATI2 
        AND Z.KD_KECAMATAN=N.KD_KECAMATAN 
        AND Z.KD_KELURAHAN=N.KD_KELURAHAN 
        AND Z.KD_ZNT=N.KD_ZNT
        AND N.RN = 1
      WHERE 1=1
    `;

    const bindParams: any = {};

    if (filter.kd_propinsi) {
      sql += ` AND Z.KD_PROPINSI = :kd_propinsi`;
      bindParams.kd_propinsi = filter.kd_propinsi;
    }
    if (filter.kd_dati2) {
      sql += ` AND Z.KD_DATI2 = :kd_dati2`;
      bindParams.kd_dati2 = filter.kd_dati2;
    }
    if (filter.kd_kecamatan) {
      sql += ` AND Z.KD_KECAMATAN = :kd_kecamatan`;
      bindParams.kd_kecamatan = filter.kd_kecamatan;
    }
    if (filter.kd_kelurahan) {
      sql += ` AND Z.KD_KELURAHAN = :kd_kelurahan`;
      bindParams.kd_kelurahan = filter.kd_kelurahan;
    }
    if (filter.kd_znt) {
      sql += ` AND Z.KD_ZNT = :kd_znt`;
      bindParams.kd_znt = filter.kd_znt;
    }

    const limit = filter.limit && filter.limit > 0 && filter.limit <= 500 ? filter.limit : 100;
    sql += ` ORDER BY Z.KD_KECAMATAN, Z.KD_KELURAHAN, Z.KD_ZNT FETCH FIRST ${limit} ROWS ONLY`;

    const result: any = await conn.execute(sql, bindParams);

    const list = (result.rows || []).map((row: any) => {
      const nirVal = Number(row.NIR) || 0;
      return {
        kd_propinsi: row.KD_PROPINSI,
        kd_dati2: row.KD_DATI2,
        kd_kecamatan: row.KD_KECAMATAN,
        nm_kecamatan: row.NM_KECAMATAN || "-",
        kd_kelurahan: row.KD_KELURAHAN,
        nm_kelurahan: row.NM_KELURAHAN || "-",
        kd_znt: row.KD_ZNT,
        nir: nirVal,
        nir_rupiah: nirVal > 0 ? nirVal * 1000 : null,
        tahun_nir: row.THN_NIR_ZNT || null,
      };
    });

    return {
      status: "SUCCESS",
      statusCode: 200,
      message: `Ditemukan ${list.length} data Zona Nilai Tanah (ZNT).`,
      total: list.length,
      data: list,
    };
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

