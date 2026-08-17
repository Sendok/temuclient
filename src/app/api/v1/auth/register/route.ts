import { apiError, apiSuccess } from "@/lib/api-response";
import { registerSchema } from "@/modules/auth/schema";
import { register } from "@/modules/auth/service";
import { setSessionCookie } from "@/server/auth/session";
import { enforceAuthRateLimit } from "@/server/auth/rate-limit";
import { sendTransactionalEmail } from "@/modules/email/provider";
import { getServerEnv } from "@/lib/env";

export async function POST(request: Request) {
  try {
    await enforceAuthRateLimit(request, "register", 10, 60 * 15);
    const input = registerSchema.parse(await request.json());
    const result = await register(input);
    await setSessionCookie(result.session.token, result.session.expiresAt);
    await sendTransactionalEmail(result.user.email, { type: "verification", verificationUrl: `${getServerEnv().APP_URL}/verify-email?token=${encodeURIComponent(result.verificationToken)}` });
    return apiSuccess({ user: { id: result.user.id, name: result.user.name, email: result.user.email } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
