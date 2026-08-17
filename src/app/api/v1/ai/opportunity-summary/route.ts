import { apiError, apiSuccess } from "@/lib/api-response";
import { opportunityAIInputSchema } from "@/modules/ai/sales-schema";
import { generateOpportunitySummary } from "@/modules/ai/sales-service";
import { requireAIActor } from "@/app/api/v1/ai/_shared";

export async function POST(request: Request) {
  try {
    const actor = await requireAIActor("opportunity_summary", true);
    const { opportunityId } = opportunityAIInputSchema.parse(await request.json());
    return apiSuccess(await generateOpportunitySummary(actor, opportunityId));
  } catch (error) {
    return apiError(error);
  }
}
