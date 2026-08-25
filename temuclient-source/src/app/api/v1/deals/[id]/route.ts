import { apiError, apiSuccess } from "@/lib/api-response";
import { updateDealSchema } from "@/modules/deals/schema";
import { getDeal, updateDeal } from "@/modules/deals/service";
import { requireMutableProviderOrganization, requireProviderOrganization } from "@/server/auth/authorization";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  try {
    const [{ id }, context] = await Promise.all([params, requireProviderOrganization()]);
    return apiSuccess(await getDeal(context.organization.id, id));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const [{ id }, context, body] = await Promise.all([
      params,
      requireMutableProviderOrganization(),
      request.json(),
    ]);
    const input = updateDealSchema.parse(body);
    return apiSuccess(
      await updateDeal(
        context.organization.id,
        context.user.id,
        context.membership.role,
        id,
        input,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
