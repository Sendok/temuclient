import { createHash, timingSafeEqual } from "node:crypto";

import { DomainError } from "@/lib/errors/domain-error";
import { getServerEnv } from "@/lib/env";
import type { MidtransNotification } from "@/modules/billing/schema";

type QRISCharge = {
  transaction_id: string;
  order_id: string;
  transaction_status: string;
  actions?: Array<{ name: string; url: string }>;
};

export async function createMidtransQRISCharge(input: {
  orderId: string;
  amount: number;
  organizationName: string;
  customerName: string;
  customerEmail: string;
}) {
  const env = getServerEnv();
  if (!env.MIDTRANS_SERVER_KEY) throw new DomainError("BILLING_NOT_CONFIGURED", "Pembayaran QRIS belum dikonfigurasi.", 503);
  const baseUrl = env.MIDTRANS_IS_PRODUCTION ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
  const response = await fetch(`${baseUrl}/v2/charge`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString("base64")}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      payment_type: "qris",
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      item_details: [{ id: "temuclient-pro-1m", price: input.amount, quantity: 1, name: "TemuClient Pro - 1 bulan" }],
      customer_details: { first_name: input.customerName, email: input.customerEmail },
      qris: { acquirer: "gopay" },
      custom_expiry: { expiry_duration: 30, unit: "minute" },
      metadata: { organization_name: input.organizationName, product: "subscription" },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json().catch(() => null) as (Partial<QRISCharge> & { status_message?: string }) | null;
  if (!response.ok || !payload || !("transaction_id" in payload)) {
    throw new DomainError("PAYMENT_PROVIDER_ERROR", payload?.status_message ?? "QRIS belum dapat dibuat. Coba kembali.", 502);
  }
  const qrisImageUrl = payload.actions?.find((action) => action.name === "generate-qr-code-v2")?.url
    ?? payload.actions?.find((action) => action.name === "generate-qr-code")?.url;
  if (!qrisImageUrl) throw new DomainError("PAYMENT_PROVIDER_ERROR", "Provider tidak mengembalikan QR pembayaran.", 502);
  return { providerTransactionId: payload.transaction_id, qrisImageUrl };
}

export function verifyMidtransNotification(input: MidtransNotification) {
  const serverKey = getServerEnv().MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;
  const expected = createHash("sha512").update(`${input.order_id}${input.status_code}${input.gross_amount}${serverKey}`).digest("hex");
  const actual = input.signature_key.toLowerCase();
  return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
