import { apiError, apiSuccess } from "@/lib/api-response";
import { updateMeetingSchema } from "@/modules/meetings/schema";
import { getMeeting, updateMeeting } from "@/modules/meetings/service";
import { requireMutableOrganization, requireOrganization } from "@/server/auth/authorization";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  try {
    const [{ id }, context] = await Promise.all([params, requireOrganization()]);
    return apiSuccess(await getMeeting(context.user.id, context.organization.id, id));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const [{ id }, context, body] = await Promise.all([params, requireMutableOrganization(), request.json()]);
    const input = updateMeetingSchema.parse(body);
    return apiSuccess(await updateMeeting(context.user.id, context.organization.id, id, input));
  } catch (error) {
    return apiError(error);
  }
}
