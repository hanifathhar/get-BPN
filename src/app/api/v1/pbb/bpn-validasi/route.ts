import { NextResponse } from "next/server";
import { querySismiop, parseNop } from "@/lib/oracle";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nop: rawNop, luas_tanah_bpn, nib, nomor_hak } = body;

    if (!rawNop) {
      return NextResponse.json(
        {
          status: "BAD_REQUEST",
          statusCode: 400,
          message: "Parameter 'nop' wajib diisi.",
        },
        { status: 400 }
      );
    }

    const nopParsed = parseNop(rawNop);
    const detail = await querySismiop("detail_nop", rawNop);

    const luasPbb = detail?.data?.luastanah_op || 0;
    const luasBpn = luas_tanah_bpn ? Number(luas_tanah_bpn) : null;

    let selisihLuas = null;
    let persentaseSelisih = null;
    let statusKesesuaianLuas = "TIDAK_DIVERIFIKASI";

    if (luasBpn !== null && !isNaN(luasBpn)) {
      selisihLuas = Math.abs(luasPbb - luasBpn);
      persentaseSelisih = luasBpn > 0 ? (selisihLuas / luasBpn) * 100 : 0;
      statusKesesuaianLuas = persentaseSelisih <= 5 ? "SESUAI" : "SELISIH_SIGNIFIKAN";
    }

    return NextResponse.json({
      status: "SUCCESS",
      statusCode: 200,
      message: "Validasi data BPN dan PBB berhasil diproses.",
      data: {
        is_valid: true,
        nop: nopParsed.formatted,
        nama_wajib_pajak: detail?.data?.nm_wp || "-",
        alamat_objek_pajak: detail?.data?.alamat_op || "-",
        kecamatan_op: detail?.data?.kecamatan_op || "-",
        kelurahan_op: detail?.data?.kelurahan_op || "-",
        luas_bumi_pbb: luasPbb,
        njop_bumi: detail?.data?.njop_tanah_op || 0,
        data_bpn: {
          nib: nib || null,
          nomor_hak: nomor_hak || null,
          luas_tanah_bpn: luasBpn,
        },
        komparasi_luas: {
          status: statusKesesuaianLuas,
          selisih_m2: selisihLuas,
          persentase_selisih: persentaseSelisih !== null ? `${persentaseSelisih.toFixed(2)}%` : null,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "ERROR",
        statusCode: 400,
        message: error.message || "Gagal memproses validasi BPN - PBB",
        data: null,
      },
      { status: 400 }
    );
  }
}
