import { apiError, apiSuccess } from "@/lib/api-response";
import { readAllNotifications } from "@/modules/notifications/service";
import { requireUser } from "@/server/auth/authorization";

export async function POST() {
  try {
    const { user } = await requireUser();
    return apiSuccess(await readAllNotifications(user.id));
  } catch (error) {
    return apiError(error);
  }
}
