import { apiError, apiSuccess } from "@/lib/api-response";
import { markDealLostSchema } from "@/modules/deals/schema";
import { markDealLost } from "@/modules/deals/service";
import { requireMutableProviderOrganization } from "@/server/auth/authorization";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, context, body] = await Promise.all([
      params,
      requireMutableProviderOrganization(),
      request.json(),
    ]);
    const input = markDealLostSchema.parse(body);
    return apiSuccess(
      await markDealLost(
        context.organization.id,
        context.user.id,
        context.membership.role,
        id,
        input.reason,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
