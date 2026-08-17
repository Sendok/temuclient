import { apiError, apiSuccess } from "@/lib/api-response";
import { dealAIInputSchema } from "@/modules/ai/sales-schema";
import { generateDealHealth } from "@/modules/ai/sales-service";
import { requireAIActor } from "@/app/api/v1/ai/_shared";

export async function POST(request: Request) {
  try {
    const actor = await requireAIActor("deal_health", true);
    const { dealId } = dealAIInputSchema.parse(await request.json());
    return apiSuccess(await generateDealHealth(actor, dealId));
  } catch (error) {
    return apiError(error);
  }
}
