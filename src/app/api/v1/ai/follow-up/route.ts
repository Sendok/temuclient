import { apiError, apiSuccess } from "@/lib/api-response";
import { followUpInputSchema } from "@/modules/ai/sales-schema";
import { generateFollowUpDraft } from "@/modules/ai/sales-service";
import { requireAIActor } from "@/app/api/v1/ai/_shared";

export async function POST(request: Request) {
  try {
    const actor = await requireAIActor("follow_up");
    const input = followUpInputSchema.parse(await request.json());
    return apiSuccess(await generateFollowUpDraft(actor, input.conversationId, input.notes, input.tone));
  } catch (error) {
    return apiError(error);
  }
}
