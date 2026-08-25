import { apiError, apiSuccess } from "@/lib/api-response";
import { readNotification } from "@/modules/notifications/service";
import { requireUser } from "@/server/auth/authorization";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, { user }] = await Promise.all([params, requireUser()]);
    return apiSuccess(await readNotification(user.id, id));
  } catch (error) {
    return apiError(error);
  }
}
