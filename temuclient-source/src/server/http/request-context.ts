export type AuditRequestContext = { ipAddress?: string; userAgent?: string };

export function getAuditRequestContext(request: Request): AuditRequestContext {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ipAddress: forwarded || request.headers.get("x-real-ip") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  };
}
