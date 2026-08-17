import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { DomainError } from "@/lib/errors/domain-error";
import { getServerEnv } from "@/lib/env";
import { resolveEffectivePlan, resolveEntitlements } from "@/modules/entitlements/service";
import { getBillingProvider } from "@/modules/billing/provider";
import type { BillingWebhook } from "@/modules/billing/schema";
import type { CreateSubscriptionCheckout, MidtransNotification } from "@/modules/billing/schema";
import { getSubscriptionCatalog } from "@/modules/billing/catalog";
import { createMidtransQRISCharge } from "@/modules/billing/midtrans";
import { db } from "@/server/db/client";

export async function getOrganizationSubscription(organizationId: string) {
  const provider = getBillingProvider();
  const subscription = await db.subscription.upsert({ where: { organizationId }, update: {}, create: { organizationId, provider: provider.name } });
  const effectivePlan = resolveEffectivePlan(subscription);
  const payments = await db.subscriptionPayment.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 10 });
  const env = getServerEnv();
  return {
    ...subscription,
    periodStart: subscription.periodStart?.toISOString() ?? null,
    periodEnd: subscription.periodEnd?.toISOString() ?? null,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
    effectivePlan,
    entitlements: resolveEntitlements(effectivePlan),
    billingMode: provider.mode,
    paymentsEnabled: env.PAID_SUBSCRIPTIONS_ENABLED,
    catalog: getSubscriptionCatalog(),
    payments: payments.map(toPaymentDTO),
  };
}

function toPaymentDTO(payment: { id: string; plan: string; amount: bigint; currency: string; method: string; status: string; provider: string; providerOrderId: string; qrisImageUrl: string | null; expiresAt: Date; paidAt: Date | null; createdAt: Date }) {
  return { ...payment, amount: payment.amount.toString(), expiresAt: payment.expiresAt.toISOString(), paidAt: payment.paidAt?.toISOString() ?? null, createdAt: payment.createdAt.toISOString() };
}

export async function createSubscriptionCheckout(input: {
  organizationId: string;
  organizationType: string;
  organizationName: string;
  userId: string;
  userName: string;
  userEmail: string;
  checkout: CreateSubscriptionCheckout;
}) {
  const env = getServerEnv();
  if (input.organizationType === "BUYER") throw new DomainError("SUBSCRIPTION_NOT_REQUIRED", "Akun pencari vendor tetap gratis.", 409);
  if (!env.PAID_SUBSCRIPTIONS_ENABLED) throw new DomainError("PAID_PLANS_NOT_AVAILABLE", "Paket berbayar belum dibuka pada tahap awal.", 409);
  if (env.BILLING_PROVIDER !== "midtrans" || !env.PRO_MONTHLY_PRICE_IDR) throw new DomainError("BILLING_NOT_CONFIGURED", "Pembayaran QRIS belum dikonfigurasi.", 503);

  const existing = await db.subscriptionPayment.findFirst({ where: { organizationId: input.organizationId, plan: input.checkout.plan, status: "PENDING", expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  if (existing) return toPaymentDTO(existing);

  const orderId = `TC-${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const subscription = await db.subscription.upsert({ where: { organizationId: input.organizationId }, update: {}, create: { organizationId: input.organizationId, provider: "midtrans" } });
  const payment = await db.subscriptionPayment.create({ data: { organizationId: input.organizationId, subscriptionId: subscription.id, createdById: input.userId, plan: input.checkout.plan, amount: BigInt(env.PRO_MONTHLY_PRICE_IDR), provider: "midtrans", providerOrderId: orderId, expiresAt } });
  try {
    const charge = await createMidtransQRISCharge({ orderId, amount: env.PRO_MONTHLY_PRICE_IDR, organizationName: input.organizationName, customerName: input.userName, customerEmail: input.userEmail });
    const updated = await db.subscriptionPayment.update({ where: { id: payment.id }, data: { providerTransactionId: charge.providerTransactionId, qrisImageUrl: charge.qrisImageUrl } });
    await db.auditLog.create({ data: { actorUserId: input.userId, actorOrganizationId: input.organizationId, action: "SUBSCRIPTION_QRIS_CREATED", entityType: "SubscriptionPayment", entityId: payment.id, afterJson: { plan: input.checkout.plan, amount: env.PRO_MONTHLY_PRICE_IDR, currency: "IDR", provider: "midtrans" } } });
    return toPaymentDTO(updated);
  } catch (error) {
    await db.subscriptionPayment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: "PROVIDER_CHARGE_FAILED" } });
    throw error;
  }
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export async function processMidtransNotification(rawBody: string, input: MidtransNotification) {
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const eventId = `${input.order_id}:${input.transaction_status}:${input.status_code}`;
  const existing = await db.billingWebhookEvent.findUnique({ where: { provider_providerEventId: { provider: "midtrans", providerEventId: eventId } } });
  if (existing?.processedAt) return { duplicate: true, eventId: existing.id };

  return db.$transaction(async (transaction) => {
    const event = await transaction.billingWebhookEvent.upsert({
      where: { provider_providerEventId: { provider: "midtrans", providerEventId: eventId } },
      update: { payloadHash, eventType: input.transaction_status },
      create: { provider: "midtrans", providerEventId: eventId, eventType: input.transaction_status, payloadHash },
    });
    const payment = await transaction.subscriptionPayment.findUnique({ where: { providerOrderId: input.order_id }, include: { subscription: true } });
    if (!payment) throw new DomainError("PAYMENT_NOT_FOUND", "Tagihan subscription tidak ditemukan.", 404);
    const notifiedAmount = BigInt(input.gross_amount.split(".")[0]);
    if (notifiedAmount !== payment.amount) throw new DomainError("PAYMENT_AMOUNT_MISMATCH", "Nominal pembayaran tidak sesuai.", 409);

    const isPaid = input.transaction_status === "settlement" && input.fraud_status !== "deny";
    const nextStatus = isPaid ? "PAID" : input.transaction_status === "expire" ? "EXPIRED" : ["deny", "failure"].includes(input.transaction_status) ? "FAILED" : input.transaction_status === "cancel" ? "CANCELLED" : "PENDING";
    const now = new Date();
    const updatedPayment = await transaction.subscriptionPayment.update({ where: { id: payment.id }, data: { status: nextStatus, paidAt: isPaid ? (payment.paidAt ?? now) : payment.paidAt, providerTransactionId: input.transaction_id ?? payment.providerTransactionId } });
    if (isPaid && payment.status !== "PAID") {
      const periodStart = payment.subscription?.periodEnd && payment.subscription.periodEnd > now ? payment.subscription.periodEnd : now;
      const subscription = await transaction.subscription.upsert({
        where: { organizationId: payment.organizationId },
        update: { plan: payment.plan, status: "ACTIVE", provider: "midtrans", periodStart, periodEnd: addMonths(periodStart, payment.billingPeriodMonths), cancelAtPeriodEnd: false },
        create: { organizationId: payment.organizationId, plan: payment.plan, status: "ACTIVE", provider: "midtrans", periodStart, periodEnd: addMonths(periodStart, payment.billingPeriodMonths) },
      });
      await transaction.subscriptionPayment.update({ where: { id: payment.id }, data: { subscriptionId: subscription.id } });
      await transaction.auditLog.create({ data: { actorOrganizationId: payment.organizationId, action: "SUBSCRIPTION_PAYMENT_SETTLED", entityType: "SubscriptionPayment", entityId: payment.id, afterJson: { plan: payment.plan, status: "PAID", amount: payment.amount.toString(), currency: payment.currency }, metadataJson: { providerEventId: eventId } } });
    }
    await transaction.billingWebhookEvent.update({ where: { id: event.id }, data: { processedAt: now } });
    return { duplicate: false, eventId: event.id, paymentId: updatedPayment.id, status: updatedPayment.status };
  });
}

export function verifyBillingWebhookSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = signature.replace(/^sha256=/, "");
  return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function processBillingWebhook(provider: string, rawBody: string, input: BillingWebhook) {
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const existing = await db.billingWebhookEvent.findUnique({ where: { provider_providerEventId: { provider, providerEventId: input.id } } });
  if (existing?.processedAt) return { duplicate: true, eventId: existing.id };
  return db.$transaction(async (transaction) => {
    const event = await transaction.billingWebhookEvent.upsert({
      where: { provider_providerEventId: { provider, providerEventId: input.id } },
      update: { payloadHash, eventType: input.type },
      create: { provider, providerEventId: input.id, eventType: input.type, payloadHash },
    });
    const organization = await transaction.organization.findUnique({ where: { id: input.data.organizationId }, select: { id: true } });
    if (!organization) throw new DomainError("NOT_FOUND", "Billing organization tidak ditemukan.", 404);
    const subscription = await transaction.subscription.upsert({
      where: { organizationId: input.data.organizationId },
      update: { plan: input.data.plan, status: input.data.status, provider, providerCustomerId: input.data.providerCustomerId, providerSubscriptionId: input.data.providerSubscriptionId, periodStart: input.data.periodStart ? new Date(input.data.periodStart) : null, periodEnd: input.data.periodEnd ? new Date(input.data.periodEnd) : null, cancelAtPeriodEnd: input.data.cancelAtPeriodEnd },
      create: { organizationId: input.data.organizationId, plan: input.data.plan, status: input.data.status, provider, providerCustomerId: input.data.providerCustomerId, providerSubscriptionId: input.data.providerSubscriptionId, periodStart: input.data.periodStart ? new Date(input.data.periodStart) : null, periodEnd: input.data.periodEnd ? new Date(input.data.periodEnd) : null, cancelAtPeriodEnd: input.data.cancelAtPeriodEnd },
    });
    await transaction.billingWebhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    await transaction.auditLog.create({ data: { actorOrganizationId: input.data.organizationId, action: "SUBSCRIPTION_UPDATED", entityType: "Subscription", entityId: subscription.id, afterJson: { plan: subscription.plan, status: subscription.status, provider }, metadataJson: { providerEventId: input.id } } });
    return { duplicate: false, eventId: event.id, subscriptionId: subscription.id };
  });
}

export function getBillingWebhookSecret() {
  const secret = getServerEnv().BILLING_WEBHOOK_SECRET;
  if (!secret) throw new DomainError("BILLING_NOT_CONFIGURED", "Billing webhook belum dikonfigurasi.", 503);
  return secret;
}
