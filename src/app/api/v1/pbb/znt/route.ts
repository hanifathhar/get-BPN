import { NextResponse } from "next/server";
import { querySismiop, queryZntWilayah } from "@/lib/oracle";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nop = searchParams.get("nop");

    // Jika query param `nop` disertakan, kembalikan detail ZNT objek pajak
    if (nop) {
      const result = await querySismiop("znt", nop);
      return NextResponse.json(result, { status: result.statusCode || 200 });
    }

    // Jika tidak ada `nop`, query master data ZNT per wilayah
    const kd_propinsi = searchParams.get("kd_propinsi") || undefined;
    const kd_dati2 = searchParams.get("kd_dati2") || undefined;
    const kd_kecamatan = searchParams.get("kd_kecamatan") || undefined;
    const kd_kelurahan = searchParams.get("kd_kelurahan") || undefined;
    const kd_znt = searchParams.get("kd_znt") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

    const result = await queryZntWilayah({
      kd_propinsi,
      kd_dati2,
      kd_kecamatan,
      kd_kelurahan,
      kd_znt,
      limit,
    });

    return NextResponse.json(result, { status: result.statusCode || 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "ERROR",
        statusCode: 400,
        message: error.message || "Gagal mengambil data ZNT",
        data: null,
      },
      { status: 400 }
    );
  }
}
