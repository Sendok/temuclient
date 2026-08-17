import { apiError, apiSuccess } from "@/lib/api-response";
import { getProviderOpportunity } from "@/modules/matching/service";
import { requireProviderOrganization } from "@/server/auth/authorization";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const [{ id }, context] = await Promise.all([params, requireProviderOrganization()]); return apiSuccess(await getProviderOpportunity(context.organization.id, id, context.user.id)); }
  catch (error) { return apiError(error); }
}
