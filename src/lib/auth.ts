import { NextResponse } from "next/server";

// Helper Base64URL Encoding & Decoding
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString();
}

/**
 * Generate HMAC-SHA256 signature using Web Crypto API (Edge & Node compatible)
 */
async function hmacSha256(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(signature)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Sign a standard JWT token for SPLP OAuth2 Bearer Auth
 */
export async function signJwt(
  payload: Record<string, any>,
  secret: string = process.env.SPLP_JWT_SECRET || "splp-default-secret-key-2026",
  expiresInSeconds: number = Number(process.env.SPLP_TOKEN_EXPIRY) || 3600
): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    iss: "SPLP-SISMIOP-PBB",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSha256(dataToSign, secret);

  return `${dataToSign}.${signature}`;
}

/**
 * Verify a JWT token
 */
export async function verifyJwt(
  token: string,
  secret: string = process.env.SPLP_JWT_SECRET || "splp-default-secret-key-2026"
): Promise<{ valid: boolean; payload?: any; reason?: string }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, reason: "Format JWT token tidak valid." };
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await hmacSha256(dataToSign, secret);

    if (signature !== expectedSignature) {
      return { valid: false, reason: "Signature JWT tidak valid atau telah dimodifikasi." };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: "Token JWT telah kadaluarsa (expired)." };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, reason: err.message || "Gagal memverifikasi JWT." };
  }
}

/**
 * Validasi API Key
 */
export function verifyApiKey(providedKey?: string | null): boolean {
  if (!providedKey) return false;
  const validKey = process.env.SPLP_API_KEY || "bpn-sismiop-pbb-secret-2026";
  return providedKey.trim() === validKey.trim();
}

/**
 * Validasi SPLP HMAC Signature & Timestamp (Replay Attack Prevention)
 * Standar SPLP: HMAC-SHA256 dari (client_id + timestamp + http_method + path)
 */
export async function verifySplpSignature(
  clientId: string,
  timestamp: string,
  providedSignature: string,
  method: string,
  path: string,
  secret: string = process.env.SPLP_SIGNATURE_SECRET || process.env.SPLP_CLIENT_SECRET || "bpn_splp_secret_key_2026"
): Promise<{ valid: boolean; reason?: string }> {
  if (!clientId || !timestamp || !providedSignature) {
    return { valid: false, reason: "Header X-Client-Id, X-Timestamp, dan X-Signature wajib disertakan." };
  }

  // Cek Timestamp (toleransi ±5 menit / 300 detik)
  let requestTimeMs: number;
  if (/^\d+$/.test(timestamp)) {
    requestTimeMs = timestamp.length === 10 ? Number(timestamp) * 1000 : Number(timestamp);
  } else {
    requestTimeMs = Date.parse(timestamp);
  }

  if (isNaN(requestTimeMs)) {
    return { valid: false, reason: "Format X-Timestamp tidak valid." };
  }

  const nowMs = Date.now();
  const diffSeconds = Math.abs(nowMs - requestTimeMs) / 1000;
  if (diffSeconds > 300) {
    return { valid: false, reason: "Timestamp telah kadaluarsa (toleransi waktu maksimal ±5 menit)." };
  }

  // Hitung Signature yang diharapkan
  const dataToSign = `${clientId}:${timestamp}:${method.toUpperCase()}:${path}`;
  const expectedSignature = await hmacSha256(dataToSign, secret);

  if (providedSignature !== expectedSignature) {
    return { valid: false, reason: "Signature SPLP HMAC tidak cocok." };
  }

  return { valid: true };
}

/**
 * Validasi mTLS (Mutual TLS) dari reverse proxy / SPLP API Gateway
 */
export function verifyMtls(headers: Headers): { valid: boolean; reason?: string } {
  const sslVerify = headers.get("x-ssl-client-verify") || headers.get("ssl-client-verify");
  const clientCert = headers.get("x-client-cert") || headers.get("x-forwarded-client-cert");

  if (sslVerify && sslVerify.toUpperCase() === "SUCCESS") {
    return { valid: true };
  }

  if (clientCert) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: "Sertifikat klien mTLS tidak terverifikasi atau header proxy mTLS tidak ditemukan.",
  };
}

/**
 * Central SPLP Authentication Inspector
 */
export async function validateSplpRequest(request: Request): Promise<{
  authenticated: boolean;
  authType?: "API_KEY" | "BEARER_TOKEN" | "SPLP_SIGNATURE" | "MTLS" | "DISABLED";
  clientInfo?: any;
  errorResponse?: NextResponse;
}> {
  const isAuthEnabled = process.env.SPLP_AUTH_ENABLED !== "false";
  const authMode = (process.env.SPLP_AUTH_MODE || "multi").toLowerCase();

  if (!isAuthEnabled || authMode === "disabled") {
    return { authenticated: true, authType: "DISABLED" };
  }

  const authHeader = request.headers.get("authorization") || "";
  const apiKeyHeader = request.headers.get("x-api-key") || request.headers.get("x-splp-key");
  const clientId = request.headers.get("x-client-id");
  const timestamp = request.headers.get("x-timestamp");
  const signature = request.headers.get("x-signature");

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // 1. Coba verifikasi Bearer Token (OAuth2 JWT)
  if (authHeader.startsWith("Bearer ") && (authMode === "multi" || authMode === "oauth2")) {
    const token = authHeader.substring(7).trim();
    const jwtResult = await verifyJwt(token);
    if (jwtResult.valid) {
      return {
        authenticated: true,
        authType: "BEARER_TOKEN",
        clientInfo: jwtResult.payload,
      };
    }
    if (authMode === "oauth2") {
      return {
        authenticated: false,
        errorResponse: createUnauthorizedResponse(jwtResult.reason || "Bearer Token tidak valid."),
      };
    }
  }

  // 2. Coba verifikasi API Key
  const isApiKeyAttempt =
    apiKeyHeader || (authHeader.startsWith("ApiKey ") || authHeader.startsWith("Api-Key "));
  if (isApiKeyAttempt && (authMode === "multi" || authMode === "apikey")) {
    const key = apiKeyHeader || authHeader.replace(/^Api-?Key\s+/i, "").trim();
    if (verifyApiKey(key)) {
      return {
        authenticated: true,
        authType: "API_KEY",
        clientInfo: { role: "SPLP_CLIENT", auth: "API_KEY" },
      };
    }
    if (authMode === "apikey") {
      return {
        authenticated: false,
        errorResponse: createUnauthorizedResponse("API Key tidak valid atau tidak cocok."),
      };
    }
  }

  // 3. Coba verifikasi SPLP HMAC Signature
  if (clientId && timestamp && signature && (authMode === "multi" || authMode === "signature")) {
    const sigResult = await verifySplpSignature(clientId, timestamp, signature, method, path);
    if (sigResult.valid) {
      return {
        authenticated: true,
        authType: "SPLP_SIGNATURE",
        clientInfo: { clientId, auth: "HMAC_SIGNATURE" },
      };
    }
    if (authMode === "signature") {
      return {
        authenticated: false,
        errorResponse: createUnauthorizedResponse(sigResult.reason || "Signature SPLP tidak valid."),
      };
    }
  }

  // 4. Coba verifikasi mTLS
  if (authMode === "mtls") {
    const mtlsResult = verifyMtls(request.headers);
    if (mtlsResult.valid) {
      return {
        authenticated: true,
        authType: "MTLS",
        clientInfo: { auth: "MTLS_CERTIFICATE" },
      };
    }
    return {
      authenticated: false,
      errorResponse: createForbiddenResponse(mtlsResult.reason || "Autentikasi mTLS gagal."),
    };
  }

  // Jika sampai di sini dalam mode multi, berarti tidak ada kredensial valid yang dikirim
  return {
    authenticated: false,
    errorResponse: createUnauthorizedResponse(
      "Akses ditolak. Permintaan memerlukan autentikasi standar SPLP (API Key, OAuth2 Bearer Token, atau SPLP HMAC Signature)."
    ),
  };
}

/**
 * Format Response Standar SPLP: 401 Unauthorized
 */
export function createUnauthorizedResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      status: "UNAUTHORIZED",
      statusCode: 401,
      message,
      splp_error: {
        code: "SPLP-401",
        description: message,
        timestamp: new Date().toISOString(),
      },
      data: null,
    },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Bearer realm="SPLP SISMIOP API", ApiKey realm="SPLP SISMIOP API"',
      },
    }
  );
}

/**
 * Format Response Standar SPLP: 403 Forbidden
 */
export function createForbiddenResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      status: "FORBIDDEN",
      statusCode: 403,
      message,
      splp_error: {
        code: "SPLP-403",
        description: message,
        timestamp: new Date().toISOString(),
      },
      data: null,
    },
    { status: 403 }
  );
}
