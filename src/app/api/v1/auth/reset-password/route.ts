import { apiError, apiSuccess } from "@/lib/api-response";
import { resetPasswordSchema } from "@/modules/auth/schema";
import { resetPassword } from "@/modules/auth/service";

export async function POST(request: Request) {
  try {
    const input = resetPasswordSchema.parse(await request.json());
    await resetPassword(input.token, input.password);
    return apiSuccess({ reset: true });
  } catch (error) {
    return apiError(error);
  }
}
