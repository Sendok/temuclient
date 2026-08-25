import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { parseServerEnv } from "../../src/lib/env";

const baseEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  APP_ENV: "test",
  APP_URL: "http://localhost:3000",
  AUTH_SECRET: "a-secure-test-secret-with-32-characters",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
};

describe("subscription QRIS configuration", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it("keeps paid subscriptions disabled by default", () => {
    const env = parseServerEnv(baseEnv);
    expect(env.BILLING_PROVIDER).toBe("sandbox");
    expect(env.PAID_SUBSCRIPTIONS_ENABLED).toBe(false);
  });

  it("requires Midtrans credentials and an approved price when enabled", () => {
    expect(() => parseServerEnv({ ...baseEnv, PAID_SUBSCRIPTIONS_ENABLED: "true" })).toThrow(/Invalid server environment/);
    const env = parseServerEnv({ ...baseEnv, PAID_SUBSCRIPTIONS_ENABLED: "true", BILLING_PROVIDER: "midtrans", MIDTRANS_SERVER_KEY: "server-key", PRO_MONTHLY_PRICE_IDR: "1490000" });
    expect(env.PRO_MONTHLY_PRICE_IDR).toBe(1_490_000);
  });

  it("matches Midtrans SHA-512 notification signing inputs", async () => {
    process.env = { ...baseEnv, MIDTRANS_SERVER_KEY: "server-key" };
    const { verifyMidtransNotification } = await import("../../src/modules/billing/midtrans");
    const notification = {
      order_id: "TC-123",
      transaction_status: "settlement" as const,
      status_code: "200",
      gross_amount: "1490000.00",
      payment_type: "qris" as const,
      signature_key: createHash("sha512").update("TC-1232001490000.00server-key").digest("hex"),
    };
    expect(verifyMidtransNotification(notification)).toBe(true);
    expect(verifyMidtransNotification({ ...notification, gross_amount: "1.00" })).toBe(false);
  });
});
