import { apiError, apiSuccess } from "@/lib/api-response";
import { conversationListQuerySchema } from "@/modules/conversations/schema";
import { listConversations } from "@/modules/conversations/service";
import { requireOrganization } from "@/server/auth/authorization";

export async function GET(request: Request) {
  try {
    const context = await requireOrganization();
    const query = conversationListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return apiSuccess(await listConversations(context.user.id, context.organization.id, query));
  } catch (error) {
    return apiError(error);
  }
}
