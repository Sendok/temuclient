import { apiError, apiSuccess } from "@/lib/api-response";
import { createProposalSchema } from "@/modules/proposals/schema";
import { createProposal, listProposals } from "@/modules/proposals/service";
import { requireMutableProviderOrganization, requireProviderOrganization } from "@/server/auth/authorization";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  try {
    const [{ id }, context] = await Promise.all([params, requireProviderOrganization()]);
    return apiSuccess(await listProposals(context.organization.id, id));
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
    const input = createProposalSchema.parse(body);
    return apiSuccess(
      await createProposal(
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
