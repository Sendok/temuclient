import { apiError, apiSuccess } from "@/lib/api-response";
import { meetingAIInputSchema } from "@/modules/ai/sales-schema";
import { generateMeetingPrep } from "@/modules/ai/sales-service";
import { requireAIActor } from "@/app/api/v1/ai/_shared";

export async function POST(request: Request) {
  try {
    const actor = await requireAIActor("meeting_prep");
    const { meetingId } = meetingAIInputSchema.parse(await request.json());
    return apiSuccess(await generateMeetingPrep(actor, meetingId));
  } catch (error) {
    return apiError(error);
  }
}
