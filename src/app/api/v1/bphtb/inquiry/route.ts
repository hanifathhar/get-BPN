import { NextResponse } from "next/server";
import { queryBphtb } from "@/lib/bphtb";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const nop = body.nop || body.NOP || body.nop_bphtb || "";
    const ntpd = body.ntpd || body.NTPD || body.no_sts || body.NO_STS || "";

    if (!nop || !ntpd) {
      return NextResponse.json(
        {
          result: null,
          message: "Parameter 'nop' dan 'ntpd' (Nomor STS) wajib disertakan.",
        },
        { status: 400 }
      );
    }

    const response = await queryBphtb(String(nop), String(ntpd));
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        result: null,
        message: error.message || "Gagal memproses permintaan inquiry data BPHTB",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nop = searchParams.get("nop") || searchParams.get("NOP") || "";
    const ntpd = searchParams.get("ntpd") || searchParams.get("NTPD") || searchParams.get("no_sts") || "";

    if (!nop || !ntpd) {
      return NextResponse.json(
        {
          result: null,
          message: "Parameter query 'nop' dan 'ntpd' (Nomor STS) wajib disertakan.",
        },
        { status: 400 }
      );
    }

    const response = await queryBphtb(nop, ntpd);
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        result: null,
        message: error.message || "Gagal memproses permintaan inquiry data BPHTB",
      },
      { status: 500 }
    );
  }
}
