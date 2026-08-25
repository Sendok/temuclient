import { apiError, apiSuccess } from "@/lib/api-response";
import { submitProposal } from "@/modules/proposals/service";
import { requireMutableProviderOrganization } from "@/server/auth/authorization";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, context] = await Promise.all([params, requireMutableProviderOrganization()]);
    return apiSuccess(
      await submitProposal(
        context.organization.id,
        context.user.id,
        context.membership.role,
        id,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
