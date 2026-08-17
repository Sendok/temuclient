import { apiError, apiSuccess } from "@/lib/api-response";
import { loginSchema } from "@/modules/auth/schema";
import { login } from "@/modules/auth/service";
import { enforceAuthRateLimit } from "@/server/auth/rate-limit";
import { setSessionCookie } from "@/server/auth/session";

export async function POST(request: Request) {
  try {
    await enforceAuthRateLimit(request, "admin-login", 10, 60 * 15);
    const input = loginSchema.parse(await request.json());
    const result = await login(input, "PLATFORM");
    await setSessionCookie(result.session.token, result.session.expiresAt);
    return apiSuccess({ user: { id: result.user.id, name: result.user.name, email: result.user.email, platformRole: result.user.platformRole } });
  } catch (error) {
    return apiError(error);
  }
}
