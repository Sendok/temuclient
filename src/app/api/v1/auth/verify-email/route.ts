import { apiError, apiSuccess } from "@/lib/api-response";
import { verifyEmailSchema } from "@/modules/auth/schema";
import { verifyEmail } from "@/modules/auth/service";

export async function POST(request: Request) {
  try {
    const { token } = verifyEmailSchema.parse(await request.json());
    await verifyEmail(token);
    return apiSuccess({ verified: true });
  } catch (error) {
    return apiError(error);
  }
}
