import { apiError, apiSuccess } from "@/lib/api-response";
import { saveOpportunity, unsaveOpportunity } from "@/modules/matching/service";
import { requireMutableProviderOrganization } from "@/server/auth/authorization";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const [{ id }, context] = await Promise.all([params, requireMutableProviderOrganization()]); return apiSuccess(await saveOpportunity(context.organization.id, context.user.id, id)); }
  catch (error) { return apiError(error); }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const [{ id }, context] = await Promise.all([params, requireMutableProviderOrganization()]); return apiSuccess(await unsaveOpportunity(context.organization.id, id)); }
  catch (error) { return apiError(error); }
}
