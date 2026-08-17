import { apiError, apiSuccess } from "@/lib/api-response";
import { listBuyerOpportunityMatches } from "@/modules/matching/service";
import { requireBuyerOrganization } from "@/server/auth/authorization";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const [{ id }, context] = await Promise.all([params, requireBuyerOrganization()]); return apiSuccess(await listBuyerOpportunityMatches(context.organization.id, id)); }
  catch (error) { return apiError(error); }
}
