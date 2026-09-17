import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "SISMIOP PBB & BPN Integration REST API",
      description:
        "Dokumentasi API Terstandarisasi untuk Integrasi dan Penarikan Data dari Database Oracle SISMIOP PBB.",
      version: "1.0.0",
    },
    paths: {
      "/api/v1/pbb/nop/{nop}": {
        get: {
          summary: "Detail Objek Pajak berdasarkan NOP",
          parameters: [
            {
              name: "nop",
              in: "path",
              required: true,
              schema: { type: "string", example: "120301005600400580" },
            },
          ],
          responses: {
            "200": { description: "Data berhasil ditemukan" },
          },
        },
      },
      "/api/v1/pbb/sppt/{nop}": {
        get: {
          summary: "Riwayat SPPT & Ketetapan PBB berdasarkan NOP",
          parameters: [
            {
              name: "nop",
              in: "path",
              required: true,
              schema: { type: "string", example: "120301005600400580" },
            },
          ],
          responses: {
            "200": { description: "Data SPPT berhasil ditemukan" },
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
            "200": { description: "Data ZNT berhasil ditemukan" },
          },
        },
      },
      "/api/v1/pbb/znt": {
        get: {
          summary: "Daftar Zona Nilai Tanah (ZNT) Master per Wilayah / Filter",
          parameters: [
            { name: "kd_kecamatan", in: "query", schema: { type: "string" } },
            { name: "kd_kelurahan", in: "query", schema: { type: "string" } },
            { name: "kd_blok", in: "query", schema: { type: "string" } },
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
            "200": { description: "Validasi berhasil diproses" },
          },
        },
      },
    },
  };
  return NextResponse.json(openApiSpec);
}

