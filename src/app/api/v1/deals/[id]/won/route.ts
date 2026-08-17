import { apiError, apiSuccess } from "@/lib/api-response";
import { markDealWonSchema } from "@/modules/deals/schema";
import { markDealWon } from "@/modules/deals/service";
import { requireMutableProviderOrganization } from "@/server/auth/authorization";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, context, body] = await Promise.all([
      params,
      requireMutableProviderOrganization(),
      request.json(),
    ]);
    const input = markDealWonSchema.parse(body);
    return apiSuccess(
      await markDealWon(
        context.organization.id,
        context.user.id,
        context.membership.role,
        id,
        input.finalValue,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
