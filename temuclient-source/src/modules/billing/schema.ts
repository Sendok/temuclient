import { z } from "zod";

export const billingWebhookSchema = z.object({
  id: z.string().trim().min(3).max(200),
  type: z.enum(["subscription.updated", "subscription.cancelled"]),
  data: z.object({
    organizationId: z.string().cuid(),
    plan: z.enum(["FREE", "PRO", "BUSINESS"]),
    status: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"]),
    providerCustomerId: z.string().trim().max(200).optional(),
    providerSubscriptionId: z.string().trim().max(200).optional(),
    periodStart: z.iso.datetime().optional(),
    periodEnd: z.iso.datetime().optional(),
    cancelAtPeriodEnd: z.boolean().default(false),
  }),
});

export type BillingWebhook = z.infer<typeof billingWebhookSchema>;

export const createSubscriptionCheckoutSchema = z.object({
  plan: z.literal("PRO"),
  billingPeriodMonths: z.literal(1).default(1),
});

export const midtransNotificationSchema = z.object({
  order_id: z.string().trim().min(1).max(200),
  transaction_id: z.string().trim().min(1).max(200).optional(),
  transaction_status: z.enum(["pending", "settlement", "capture", "expire", "deny", "cancel", "failure"]),
  status_code: z.string().trim().min(1).max(10),
  gross_amount: z.string().regex(/^\d+(?:\.00)?$/),
  signature_key: z.string().trim().min(64),
  fraud_status: z.string().trim().optional(),
  settlement_time: z.string().trim().optional(),
  expiry_time: z.string().trim().optional(),
  payment_type: z.literal("qris"),
});

export type CreateSubscriptionCheckout = z.infer<typeof createSubscriptionCheckoutSchema>;
export type MidtransNotification = z.infer<typeof midtransNotificationSchema>;
