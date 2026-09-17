import { NextResponse } from "next/server";
import { signJwt } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    let clientId = "";
    let clientSecret = "";
    let grantType = "client_credentials";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      clientId = body.client_id || "";
      clientSecret = body.client_secret || "";
      grantType = body.grant_type || "client_credentials";
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      clientId = (formData.get("client_id") as string) || "";
      clientSecret = (formData.get("client_secret") as string) || "";
      grantType = (formData.get("grant_type") as string) || "client_credentials";
    } else {
      // Cek Basic Auth header
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader.startsWith("Basic ")) {
        const decoded = Buffer.from(authHeader.substring(6), "base64").toString();
        const [id, secret] = decoded.split(":");
        clientId = id || "";
        clientSecret = secret || "";
      }
    }

    const expectedClientId = process.env.SPLP_CLIENT_ID || "bpn_splp_client";
    const expectedClientSecret = process.env.SPLP_CLIENT_SECRET || "bpn_splp_secret_key_2026";

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Parameter 'client_id' dan 'client_secret' wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (clientId !== expectedClientId || clientSecret !== expectedClientSecret) {
      return NextResponse.json(
        {
          error: "invalid_client",
          error_description: "Kredensial client_id atau client_secret tidak valid.",
        },
        { status: 401 }
      );
    }

    const expiresIn = Number(process.env.SPLP_TOKEN_EXPIRY) || 3600;
    const token = await signJwt(
      {
        client_id: clientId,
        scope: "pbb:read pbb:validate",
        role: "SPLP_CLIENT",
      },
      process.env.SPLP_JWT_SECRET,
      expiresIn
    );

    return NextResponse.json({
      status: "SUCCESS",
      token_type: "Bearer",
      access_token: token,
      expires_in: expiresIn,
      scope: "pbb:read pbb:validate",
      issued_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "server_error",
        error_description: err.message || "Gagal memproses pembuatan token SPLP.",
      },
      { status: 500 }
    );
  }
}
