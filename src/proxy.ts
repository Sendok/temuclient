import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id")?.slice(0, 128) || crypto.randomUUID();
  const nonce = btoa(crypto.randomUUID());
  const isDevelopment = process.env.NODE_ENV === "development";
  const csp = ["default-src 'self'", `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`, "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https:", "font-src 'self' data:", "connect-src 'self' https://generativelanguage.googleapis.com https://api.resend.com", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "upgrade-insecure-requests"].join("; ");
  if (request.nextUrl.pathname.startsWith("/api/v1/") && !SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    const configured = process.env.APP_URL ? new URL(process.env.APP_URL).origin : request.nextUrl.origin;
    if (origin && origin !== configured && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: { code: "CSRF_REJECTED", message: "Request origin tidak diizinkan.", fieldErrors: {} } }, { status: 403, headers: { "x-request-id": requestId } });
    }
  }
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  headers.set("x-request-start", String(Date.now()));
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
