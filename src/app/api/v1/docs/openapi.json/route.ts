import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "SISMIOP PBB & BPN Integration REST API (SPLP Standard)",
      description:
        "Dokumentasi API Terstandarisasi untuk Integrasi dan Penarikan Data dari Database Oracle SISMIOP PBB dengan Standar Keamanan SPLP (API Key, OAuth2 Bearer, SPLP Signature, mTLS).",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API Key SPLP (Header X-API-Key atau Authorization: ApiKey <key>)",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "OAuth2 Bearer Token didapatkan dari endpoint POST /api/v1/auth/token",
        },
        SPLPSignatureAuth: {
          type: "apiKey",
          in: "header",
          name: "X-Signature",
          description: "Header SPLP HMAC-SHA256: X-Client-Id, X-Timestamp, X-Signature",
        },
      },
    },
    security: [
      { ApiKeyAuth: [] },
      { BearerAuth: [] },
      { SPLPSignatureAuth: [] },
    ],
    paths: {
      "/api/v1/auth/token": {
        post: {
          summary: "Mendapatkan Access Token OAuth2 (SPLP Client Credentials)",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    client_id: { type: "string", example: "bpn_splp_client" },
                    client_secret: { type: "string", example: "bpn_splp_secret_key_2026" },
                    grant_type: { type: "string", example: "client_credentials" },
                  },
                  required: ["client_id", "client_secret"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Token berhasil diterbitkan",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "SUCCESS" },
                      token_type: { type: "string", example: "Bearer" },
                      access_token: { type: "string", example: "eyJhbGciOiJIUzI1Ni..." },
                      expires_in: { type: "integer", example: 3600 },
                    },
                  },
                },
              },
            },
            "401": { description: "Kredensial client tidak valid" },
          },
        },
      },
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
            "401": { description: "Unauthorized / Kredensial SPLP tidak valid" },
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
            "401": { description: "Unauthorized / Kredensial SPLP tidak valid" },
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
            "401": { description: "Unauthorized / Kredensial SPLP tidak valid" },
          },
        },
      },
      "/api/v1/pbb/znt": {
        get: {
          summary: "Daftar Zona Nilai Tanah (ZNT) Master per Wilayah / Filter",
          parameters: [
            { name: "kd_kecamatan", in: "query", schema: { type: "string" } },
            { name: "kd_kelurahan", in: "query", schema: { type: "string" } },
            { name: "kd_znt", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 100 } },
          ],
          responses: {
            "200": { description: "Daftar ZNT berhasil ditemukan" },
            "401": { description: "Unauthorized / Kredensial SPLP tidak valid" },
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
            "401": { description: "Unauthorized / Kredensial SPLP tidak valid" },
          },
        },
      },
    },
  };
  return NextResponse.json(openApiSpec);
}


