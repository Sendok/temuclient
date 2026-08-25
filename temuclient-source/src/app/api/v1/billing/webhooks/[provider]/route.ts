import { apiError, apiSuccess } from "@/lib/api-response";
import { billingWebhookSchema, midtransNotificationSchema } from "@/modules/billing/schema";
import { getBillingWebhookSecret, processBillingWebhook, processMidtransNotification, verifyBillingWebhookSignature } from "@/modules/billing/service";
import { DomainError } from "@/lib/errors/domain-error";
import { verifyMidtransNotification } from "@/modules/billing/midtrans";

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const [{ provider }, rawBody] = await Promise.all([params, request.text()]);
    if (provider === "midtrans") {
      const input = midtransNotificationSchema.parse(JSON.parse(rawBody));
      if (!verifyMidtransNotification(input)) throw new DomainError("WEBHOOK_SIGNATURE_INVALID", "Webhook signature tidak valid.", 401);
      return apiSuccess(await processMidtransNotification(rawBody, input));
    }
    if (provider !== "sandbox") throw new DomainError("BILLING_PROVIDER_NOT_FOUND", "Billing provider tidak dikenal.", 404);
    if (!verifyBillingWebhookSignature(rawBody, request.headers.get("x-temuclient-signature"), getBillingWebhookSecret())) throw new DomainError("WEBHOOK_SIGNATURE_INVALID", "Webhook signature tidak valid.", 401);
    const input = billingWebhookSchema.parse(JSON.parse(rawBody));
    return apiSuccess(await processBillingWebhook(provider, rawBody, input));
  } catch (error) { return apiError(error); }
}
