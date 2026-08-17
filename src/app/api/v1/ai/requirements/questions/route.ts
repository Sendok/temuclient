import { apiError, apiSuccess } from "@/lib/api-response";
import { executeRequirementAssistant, requirementTextSchema } from "@/modules/ai/requirements";
import { requireBuyerManager } from "@/server/auth/authorization";
import { enforceAIRateLimit } from "@/server/auth/rate-limit";
import { getEffectiveEntitlements } from "@/modules/entitlements/access";
export async function POST(request: Request) { try { const context = await requireBuyerManager(); const access = await getEffectiveEntitlements(context.organization.id); await enforceAIRateLimit({ userId: context.user.id, organizationId: context.organization.id, feature: "requirement_questions", plan: access.plan }); const { text } = requirementTextSchema.parse(await request.json()); return apiSuccess(await executeRequirementAssistant("questions", text, context.user.id, context.organization.id)); } catch (error) { return apiError(error); } }
