import { apiError, apiSuccess } from "@/lib/api-response";
import { proposalOutlineInputSchema } from "@/modules/ai/sales-schema";
import { generateProposalOutline } from "@/modules/ai/sales-service";
import { requireAIActor } from "@/app/api/v1/ai/_shared";

export async function POST(request: Request) {
  try {
    const actor = await requireAIActor("proposal_outline", true);
    const input = proposalOutlineInputSchema.parse(await request.json());
    return apiSuccess(await generateProposalOutline(actor, input.dealId, input.notes));
  } catch (error) {
    return apiError(error);
  }
}
