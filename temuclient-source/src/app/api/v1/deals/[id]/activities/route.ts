import { apiError, apiSuccess } from "@/lib/api-response";
import { activityListQuerySchema, createDealActivitySchema } from "@/modules/deals/schema";
import { addDealActivity, listDealActivities } from "@/modules/deals/service";
import { requireMutableProviderOrganization, requireProviderOrganization } from "@/server/auth/authorization";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const [{ id }, context] = await Promise.all([params, requireProviderOrganization()]);
    const query = activityListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return apiSuccess(await listDealActivities(context.organization.id, id, query.type));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const [{ id }, context, body] = await Promise.all([
      params,
      requireMutableProviderOrganization(),
      request.json(),
    ]);
    const input = createDealActivitySchema.parse(body);
    return apiSuccess(
      await addDealActivity(
        context.organization.id,
        context.user.id,
        context.membership.role,
        id,
        input,
      ),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
