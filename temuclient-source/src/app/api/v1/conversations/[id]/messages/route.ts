import { apiError, apiSuccess } from "@/lib/api-response";
import { messageListQuerySchema, sendMessageSchema } from "@/modules/conversations/schema";
import { listMessages, sendMessage } from "@/modules/conversations/service";
import { requireMutableOrganization, requireOrganization } from "@/server/auth/authorization";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const [{ id }, context] = await Promise.all([params, requireOrganization()]);
    const query = messageListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return apiSuccess(await listMessages(context.user.id, context.organization.id, id, query));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const [{ id }, context, body] = await Promise.all([params, requireMutableOrganization(), request.json()]);
    const input = sendMessageSchema.parse(body);
    return apiSuccess(await sendMessage(context.user.id, context.organization.id, id, input), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
