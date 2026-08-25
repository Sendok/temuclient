import { apiError, apiSuccess } from "@/lib/api-response";
import { updateProfileSchema } from "@/modules/users/schema";
import { requireUser } from "@/server/auth/authorization";
import { db } from "@/server/db/client";

export async function PATCH(request: Request) {
  try {
    const { user } = await requireUser();
    const input = updateProfileSchema.parse(await request.json());
    const updated = await db.user.update({ where: { id: user.id }, data: input, select: { id: true, name: true, email: true } });
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error);
  }
}
