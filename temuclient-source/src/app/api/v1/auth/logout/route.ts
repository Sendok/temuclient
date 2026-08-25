import { apiError, apiSuccess } from "@/lib/api-response";
import { revokeCurrentSession } from "@/server/auth/session";

export async function POST() {
  try {
    await revokeCurrentSession();
    return apiSuccess({ loggedOut: true });
  } catch (error) {
    return apiError(error);
  }
}
