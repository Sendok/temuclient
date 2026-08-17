import { apiError, apiSuccess } from "@/lib/api-response";
import { createMeetingSchema, meetingListQuerySchema } from "@/modules/meetings/schema";
import { createMeeting, listMeetings } from "@/modules/meetings/service";
import { requireMutableOrganization, requireOrganization } from "@/server/auth/authorization";

export async function GET(request: Request) {
  try {
    const context = await requireOrganization();
    const query = meetingListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return apiSuccess(await listMeetings(context.user.id, context.organization.id, query));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const [context, body] = await Promise.all([requireMutableOrganization(), request.json()]);
    const input = createMeetingSchema.parse(body);
    return apiSuccess(await createMeeting(context.user.id, context.organization.id, input), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
