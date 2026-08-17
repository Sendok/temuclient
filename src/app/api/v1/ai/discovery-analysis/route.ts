import { apiError, apiSuccess } from "@/lib/api-response";
import { discoveryAnalysisInputSchema } from "@/modules/ai/sales-schema";
import { generateDiscoveryAnalysis } from "@/modules/ai/sales-service";
import { requireAIActor } from "@/app/api/v1/ai/_shared";

export async function POST(request: Request) {
  try {
    const actor = await requireAIActor("discovery_analysis");
    const input = discoveryAnalysisInputSchema.parse(await request.json());
    return apiSuccess(await generateDiscoveryAnalysis(actor, input.meetingId, input.notes));
  } catch (error) {
    return apiError(error);
  }
}
