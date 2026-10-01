import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "SISMIOP PBB & BPHTB Integration REST API",
      description:
        "Dokumentasi API Terbuka (Bebas Autentikasi / Tanpa X-API-Key) untuk Integrasi dan Penarikan Data dari Database Oracle SISMIOP PBB dan PostgreSQL BPHTB.",
      version: "1.0.0",
    },
    paths: {
      "/api/v1/pbb/nop/{nop}": {
        get: {
          summary: "Detail Objek Pajak & Subjek Pajak berdasarkan NOP (Oracle SISMIOP)",
          parameters: [
            {
              name: "nop",
              in: "path",
              required: true,
              schema: { type: "string", example: "120301005600400580" },
              description: "Nomor Objek Pajak (18 Digit Angka)",
            },
          ],
          responses: {
            "200": {
              description: "Data Objek Pajak berhasil ditemukan",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "SUCCESS" },
                      statusCode: { type: "integer", example: 200 },
                      message: { type: "string", example: "Data Objek Pajak berhasil ditemukan." },
                      data: {
                        type: "object",
                        properties: {
                          nop: { type: "string", example: "12.03.010.056.004-0058.0" },
                          nop_raw: { type: "string", example: "120301005600400580" },
                          nm_wp: { type: "string", example: "NURHASANAH NASUTION" },
                          alamat_op: { type: "string", example: "JL.LINTAS SUMATERA" },
                          kecamatan_op: { type: "string", example: "KEC.BATANG ANGKOLA" },
                          kelurahan_op: { type: "string", example: "SORIK" },
                          kota_op: { type: "string", example: "-" },
                          luastanah_op: { type: "number", example: 157 },
                          luasbangunan_op: { type: "number", example: 64 },
                          njop_tanah_op: { type: "number", example: 12560000 },
                          njop_bangunan_op: { type: "number", example: 45000000 },
                          status_tunggakan: { type: "string", example: "-" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Format NOP tidak valid (harus 18 digit)" },
            "404": { description: "Data NOP tidak ditemukan di basis data" },
          },
        },
      },
      "/api/v1/pbb/sppt/{nop}": {
        get: {
          summary: "Riwayat SPPT & Ketetapan PBB berdasarkan NOP (Oracle SISMIOP)",
          parameters: [
            {
              name: "nop",
              in: "path",
              required: true,
              schema: { type: "string", example: "120301005600400580" },
              description: "Nomor Objek Pajak (18 Digit)",
            },
          ],
          responses: {
            "200": {
              description: "Data SPPT berhasil ditemukan",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "SUCCESS" },
                      statusCode: { type: "integer", example: 200 },
                      total_records: { type: "integer", example: 5 },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            thn_pajak_sppt: { type: "string", example: "2026" },
                            pbb_yg_harus_dibayar_sppt: { type: "number", example: 75000 },
                            status_pembayaran_sppt: { type: "string", example: "1" },
                            tgl_pembayaran_sppt: { type: "string", example: "2026-03-15" },
                            luas_bumi_sppt: { type: "number", example: 157 },
                            luas_bng_sppt: { type: "number", example: 64 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Format NOP tidak valid" },
          },
        },
      },
      "/api/v1/pbb/znt/{nop}": {
        get: {
          summary: "Melihat Zona Nilai Tanah (ZNT) & NIR berdasarkan NOP",
          parameters: [
            {
              name: "nop",
              in: "path",
              required: true,
              schema: { type: "string", example: "120301005600400580" },
            },
          ],
          responses: {
            "200": {
              description: "Data ZNT berhasil ditemukan",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "SUCCESS" },
                      statusCode: { type: "integer", example: 200 },
                      data: {
                        type: "object",
                        properties: {
                          nop: { type: "string" },
                          kd_znt: { type: "string", example: "AA" },
                          nir: { type: "number", example: 80000 },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Format NOP tidak valid" },
          },
        },
      },
      "/api/v1/pbb/znt": {
        get: {
          summary: "Daftar Master Zona Nilai Tanah (ZNT) per Wilayah",
          parameters: [
            { name: "kd_kecamatan", in: "query", schema: { type: "string" } },
            { name: "kd_kelurahan", in: "query", schema: { type: "string" } },
            { name: "kd_znt", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 100 } },
          ],
          responses: {
            "200": { description: "Daftar ZNT berhasil ditemukan" },
          },
        },
      },
      "/api/v1/pbb/bpn-validasi": {
        post: {
          summary: "Validasi Komparasi Data Bidang Tanah BPN & PBB",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    nop: { type: "string", example: "120301005600400580" },
                    nib: { type: "string", example: "10.01.05.02.01234" },
                    nomor_hak: { type: "string", example: "M.02154" },
                    luas_tanah_bpn: { type: "number", example: 157 },
                  },
                  required: ["nop"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Validasi komparasi bidang tanah berhasil diproses",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "SUCCESS" },
                      statusCode: { type: "integer", example: 200 },
                      validation_result: {
                        type: "object",
                        properties: {
                          is_valid: { type: "boolean", example: true },
                          luas_match: { type: "boolean", example: true },
                          selisih_luas: { type: "number", example: 0 },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Parameter NOP wajib disertakan" },
          },
        },
      },
      "/api/v1/bphtb/inquiry": {
        post: {
          summary: "Inquiry Data Status & Pembayaran BPHTB (PostgreSQL)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    nop: { type: "string", example: "120301005600400580" },
                    ntpd: { type: "string", example: "202601001" },
                  },
                  required: ["nop", "ntpd"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Data BPHTB berhasil ditemukan",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      result: {
                        type: "object",
                        nullable: true,
                        properties: {
                          NOP: { type: "string" },
                          NIK: { type: "string" },
                          NAMA: { type: "string" },
                          ALAMAT: { type: "string" },
                          KELURAHAN_OP: { type: "string" },
                          KECAMATAN_OP: { type: "string" },
                          KOTA_OP: { type: "string" },
                          LUASTANAH: { type: "number" },
                          LUASBANGUNAN: { type: "number" },
                          PEMBAYARAN: { type: "number" },
                          STATUS: { type: "string", example: "Y" },
                          TANGGAL_PEMBAYARAN: { type: "string", example: "20/01/2026" },
                          NTPD: { type: "string" },
                          JENISBAYAR: { type: "string", example: "L" },
                        },
                      },
                      message: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
            "400": { description: "Parameter NOP / NTPD tidak lengkap" },
            "500": { description: "Terjadi kesalahan koneksi basis data" },
          },
        },
        get: {
          summary: "Inquiry Data Status & Pembayaran BPHTB via Query Params",
          parameters: [
            {
              name: "nop",
              in: "query",
              required: true,
              schema: { type: "string", example: "120301005600400580" },
            },
            {
              name: "ntpd",
              in: "query",
              required: true,
              schema: { type: "string", example: "202601001" },
            },
          ],
          responses: {
            "200": { description: "Data BPHTB berhasil ditemukan" },
            "400": { description: "Parameter query NOP / NTPD tidak lengkap" },
            "500": { description: "Terjadi kesalahan koneksi basis data" },
          },
        },
      },
    },
  };
  return NextResponse.json(openApiSpec);
}
