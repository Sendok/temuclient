import { apiError, apiSuccess } from "@/lib/api-response";
import { updateProposalSchema } from "@/modules/proposals/schema";
import { getProposal, updateProposal } from "@/modules/proposals/service";
import { requireMutableProviderOrganization, requireProviderOrganization } from "@/server/auth/authorization";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  try {
    const [{ id }, context] = await Promise.all([params, requireProviderOrganization()]);
    return apiSuccess(await getProposal(context.organization.id, id));
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
    const input = updateProposalSchema.parse(body);
    return apiSuccess(
      await updateProposal(
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
