import { apiError, apiSuccess } from "@/lib/api-response";
import { forgotPasswordSchema } from "@/modules/auth/schema";
import { requestPasswordReset } from "@/modules/auth/service";
import { enforceAuthRateLimit } from "@/server/auth/rate-limit";
import { sendTransactionalEmail } from "@/modules/email/provider";
import { getServerEnv } from "@/lib/env";

export async function POST(request: Request) {
  try {
    await enforceAuthRateLimit(request, "forgot-password", 5, 60 * 30);
    const { email } = forgotPasswordSchema.parse(await request.json());
    const token = await requestPasswordReset(email);
    if (token) await sendTransactionalEmail(email, { type: "password_reset", resetUrl: `${getServerEnv().APP_URL}/reset-password?token=${encodeURIComponent(token)}` });
    return apiSuccess({ message: "Jika email terdaftar, instruksi reset akan dikirim." });
  } catch (error) {
    return apiError(error);
  }
}
