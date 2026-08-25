import { apiError, apiSuccess } from "@/lib/api-response";
import { getConversation } from "@/modules/conversations/service";
import { requireOrganization } from "@/server/auth/authorization";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, context] = await Promise.all([params, requireOrganization()]);
    return apiSuccess(await getConversation(context.user.id, context.organization.id, id));
  } catch (error) {
    return apiError(error);
  }
}
