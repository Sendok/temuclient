import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { parseServerEnv } from "../../src/lib/env";
import { sanitizeLogContext } from "../../src/lib/observability/logger";
import { resolveEffectivePlan, resolveEntitlements } from "../../src/modules/entitlements/service";
import { verifyBillingWebhookSignature } from "../../src/modules/billing/service";
import { createStorageKey, isOrganizationStorageKey } from "../../src/modules/storage/service";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";

const baseEnv = { NODE_ENV: "test", APP_ENV: "test", APP_URL: "http://localhost:3000", AUTH_SECRET: "a".repeat(32), DATABASE_URL: "postgresql://localhost/test", REDIS_URL: "redis://localhost:6379" } as NodeJS.ProcessEnv;

describe("Phase 10 production security and configuration", () => {
  it("resolves centralized plan entitlements monotonically", () => {
    expect(resolveEntitlements("FREE")).toMatchObject({ aiRequestsPerHour: 10, advancedAnalytics: false, matchIntelligence: false, aiSalesAssistant: false });
    expect(resolveEntitlements("PRO")).toMatchObject({ aiRequestsPerHour: 50, advancedAnalytics: true, matchIntelligence: true, aiSalesAssistant: true });
    expect(resolveEntitlements("BUSINESS")).toMatchObject({ aiRequestsPerHour: 200, prioritySupport: true, teamSeats: null });
  });

  it("falls back to FREE when subscription is inactive or expired", () => {
    const now = new Date("2026-08-12T00:00:00Z");
    expect(resolveEffectivePlan({ plan: "PRO", status: "ACTIVE", periodEnd: new Date("2026-09-12T00:00:00Z") }, now)).toBe("PRO");
    expect(resolveEffectivePlan({ plan: "BUSINESS", status: "EXPIRED", periodEnd: null }, now)).toBe("FREE");
    expect(resolveEffectivePlan({ plan: "PRO", status: "ACTIVE", periodEnd: new Date("2026-08-11T00:00:00Z") }, now)).toBe("FREE");
  });

  it("validates environment-specific production dependencies", () => {
    expect(parseServerEnv(baseEnv).APP_ENV).toBe("test");
    expect(() => parseServerEnv({ ...baseEnv, NODE_ENV: "production", APP_ENV: "production", APP_URL: "http://insecure.test" })).toThrow(/APP_URL/);
    expect(() => parseServerEnv({ ...baseEnv, S3_PROVIDER: "s3" })).toThrow(/S3_ENDPOINT/);
  });

  it("redacts secrets from structured logs", () => {
    expect(sanitizeLogContext({ token: "secret", password: "secret", userId: "user-1" })).toEqual({ token: "[REDACTED]", password: "[REDACTED]", userId: "user-1" });
  });

  it("uses timing-safe signed billing webhook verification", () => {
    const body = JSON.stringify({ id: "evt_1" }); const secret = "webhook-secret";
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyBillingWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyBillingWebhookSignature(body, "bad", secret)).toBe(false);
  });

  it("creates opaque tenant-scoped storage keys", () => {
    const key = createStorageKey("org_test", { category: "COMPANY_DOCUMENT", fileName: "legal.pdf", mimeType: "application/pdf", size: 1000 });
    expect(isOrganizationStorageKey(key, "org_test")).toBe(true);
    expect(isOrganizationStorageKey(key, "org_other")).toBe(false);
    expect(key).not.toContain("legal");
  });

  it("rejects cross-origin state-changing API requests and emits a request id", async () => {
    const blocked = proxy(new NextRequest("http://localhost:3000/api/v1/opportunities", { method: "POST", headers: { origin: "https://attacker.example" } }));
    expect(blocked.status).toBe(403);
    expect(blocked.headers.get("x-request-id")).toBeTruthy();
    await expect(blocked.json()).resolves.toMatchObject({ error: { code: "CSRF_REJECTED" } });
  });
});
