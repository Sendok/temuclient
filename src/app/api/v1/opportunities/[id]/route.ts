import { apiError, apiSuccess } from "@/lib/api-response";
import { updateOpportunitySchema } from "@/modules/opportunities/schema";
import { getBuyerOpportunity, updateOpportunityDraft } from "@/modules/opportunities/service";
import { requireBuyerManager, requireBuyerOrganization } from "@/server/auth/authorization";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireBuyerOrganization()]); return apiSuccess(await getBuyerOpportunity(context.organization.id, id)); } catch (error) { return apiError(error); } }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireBuyerManager()]); const input = updateOpportunitySchema.parse(await request.json()); return apiSuccess(await updateOpportunityDraft(context.organization.id, context.user.id, id, input)); } catch (error) { return apiError(error); } }
