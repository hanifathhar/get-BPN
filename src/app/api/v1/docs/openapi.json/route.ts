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
    },
  };
  return NextResponse.json(openApiSpec);
}
