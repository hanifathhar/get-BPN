import { NextResponse } from "next/server";
import { queryBphtb } from "@/lib/bphtb";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const NOP = body.nop ?? body.NOP ?? body.nop_bphtb ?? "";
    const NTPD = body.ntpd ?? body.NTPD ?? body.npd ?? body.NPD ?? body.no_sts ?? body.NO_STS ?? "";

    const response = await queryBphtb(String(NOP), String(NTPD));
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        respon_code: error.message || "Data tidak ditemukan",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const NOP = searchParams.get("NOP") ?? searchParams.get("nop") ?? "";
    const NTPD =
      searchParams.get("NTPD") ??
      searchParams.get("ntpd") ??
      searchParams.get("NPD") ??
      searchParams.get("npd") ??
      searchParams.get("no_sts") ??
      "";

    const response = await queryBphtb(NOP, NTPD);
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        respon_code: error.message || "Data tidak ditemukan",
      },
      { status: 500 }
    );
  }
}
