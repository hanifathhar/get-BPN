import { NextResponse } from "next/server";
import { querySismiop } from "@/lib/oracle";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ nop: string }> }
) {
  try {
    const { nop: rawNop } = await params;
    const result = await querySismiop("detail_nop", rawNop);
    return NextResponse.json(result, { status: result.statusCode || 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "ERROR",
        statusCode: 400,
        message: error.message || "Gagal memproses data NOP",
        data: null,
      },
      { status: 400 }
    );
  }
}
