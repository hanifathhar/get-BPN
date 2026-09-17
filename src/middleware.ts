import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSplpRequest } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Endpoint publik yang tidak memerlukan autentikasi
  if (
    path === "/api/v1/auth/token" ||
    path.startsWith("/api/v1/docs") ||
    !path.startsWith("/api/v1/")
  ) {
    return NextResponse.next();
  }

  // Validasi Keamanan SPLP
  const authResult = await validateSplpRequest(request);

  if (!authResult.authenticated && authResult.errorResponse) {
    return authResult.errorResponse;
  }

  const response = NextResponse.next();
  if (authResult.authType) {
    response.headers.set("X-SPLP-Auth-Type", authResult.authType);
  }

  return response;
}

// Konfigurasi matcher rute API yang diproteksi
export const config = {
  matcher: ["/api/v1/pbb/:path*", "/api/v1/:path*"],
};
