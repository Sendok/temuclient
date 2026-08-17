import { apiError, apiSuccess } from "@/lib/api-response";
import { notificationListQuerySchema } from "@/modules/notifications/schema";
import { listNotifications } from "@/modules/notifications/service";
import { requireUser } from "@/server/auth/authorization";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser();
    const query = notificationListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return apiSuccess(await listNotifications(user.id, query));
  } catch (error) {
    return apiError(error);
  }
}
