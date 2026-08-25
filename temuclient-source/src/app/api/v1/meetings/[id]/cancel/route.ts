import { apiError, apiSuccess } from "@/lib/api-response";
import { cancelMeeting } from "@/modules/meetings/service";
import { requireMutableOrganization } from "@/server/auth/authorization";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, context] = await Promise.all([params, requireMutableOrganization()]);
    return apiSuccess(await cancelMeeting(context.user.id, context.organization.id, id));
  } catch (error) {
    return apiError(error);
  }
}
