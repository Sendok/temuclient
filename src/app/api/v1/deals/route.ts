import { apiError, apiSuccess } from "@/lib/api-response";
import { createDealSchema, dealListQuerySchema } from "@/modules/deals/schema";
import { createDeal, listDeals } from "@/modules/deals/service";
import { requireMutableProviderOrganization, requireProviderOrganization } from "@/server/auth/authorization";

export async function GET(request: Request) {
  try {
    const context = await requireProviderOrganization();
    const query = dealListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return apiSuccess(await listDeals(context.organization.id, query));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const [context, body] = await Promise.all([requireMutableProviderOrganization(), request.json()]);
    const input = createDealSchema.parse(body);
    return apiSuccess(
      await createDeal(
        context.organization.id,
        context.user.id,
        context.membership.role,
        input,
      ),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
