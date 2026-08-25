import { apiError, apiSuccess } from "@/lib/api-response";
import { createOpportunitySchema } from "@/modules/opportunities/schema";
import { createOpportunityDraft, listBuyerOpportunities } from "@/modules/opportunities/service";
import { requireBuyerManager, requireBuyerOrganization } from "@/server/auth/authorization";

export async function GET() { try { const context = await requireBuyerOrganization(); return apiSuccess(await listBuyerOpportunities(context.organization.id)); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { const context = await requireBuyerManager(); const input = createOpportunitySchema.parse(await request.json()); return apiSuccess(await createOpportunityDraft(context.organization.id, context.user.id, input), { status: 201 }); } catch (error) { return apiError(error); } }
