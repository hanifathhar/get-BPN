import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Semua endpoint API bebas autentikasi / tanpa x-api-key
  return NextResponse.next();
}

// Konfigurasi matcher rute API
export const config = {
  matcher: ["/api/v1/:path*"],
};
