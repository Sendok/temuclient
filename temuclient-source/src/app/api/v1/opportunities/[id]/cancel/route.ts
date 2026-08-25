import { apiError, apiSuccess } from "@/lib/api-response";
import { cancelOpportunity } from "@/modules/opportunities/service";
import { requireBuyerManager } from "@/server/auth/authorization";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireBuyerManager()]); return apiSuccess(await cancelOpportunity(context.organization.id, context.user.id, id)); } catch (error) { return apiError(error); } }
