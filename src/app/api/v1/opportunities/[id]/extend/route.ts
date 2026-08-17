import { apiError, apiSuccess } from "@/lib/api-response";
import { extendOpportunitySchema } from "@/modules/opportunities/schema";
import { extendOpportunity } from "@/modules/opportunities/service";
import { requireBuyerManager } from "@/server/auth/authorization";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireBuyerManager()]); const { days } = extendOpportunitySchema.parse(await request.json().catch(() => ({}))); return apiSuccess(await extendOpportunity(context.organization.id, context.user.id, id, days)); } catch (error) { return apiError(error); } }
