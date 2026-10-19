import { NextResponse } from "next/server";
import { queryBphtb } from "@/lib/bphtb";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const NOP = body.nop || body.NOP || body.nop_bphtb || "";
        const NTPD = body.ntpd || body.NTPD || body.no_sts || body.NO_STS || "";

        if (!NOP || !NTPD) {
            return NextResponse.json(
                {
                    result: null,
                    message: "Parameter 'NOP' dan 'NTPD' (Nomor STS) wajib disertakan.",
                },
                { status: 400 }
            );
        }

        const response = await queryBphtb(String(NOP), String(NTPD));
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
        const NOP = searchParams.get("NOP") || searchParams.get("NOP") || "";
        const NTPD = searchParams.get("NTPD") || searchParams.get("NTPD") || searchParams.get("no_sts") || "";

        if (!NOP || !NTPD) {
            return NextResponse.json(
                {
                    result: null,
                    message: "Parameter query 'NOP' dan 'NTPD' (Nomor STS) wajib disertakan.",
                },
                { status: 400 }
            );
        }

        const response = await queryBphtb(NOP, NTPD);
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
