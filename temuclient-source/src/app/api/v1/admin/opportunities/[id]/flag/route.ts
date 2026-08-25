import { apiError, apiSuccess } from "@/lib/api-response";
import { flagOpportunitySchema } from "@/modules/admin/schema";
import { flagOpportunity } from "@/modules/admin/service";
import { requirePlatformRole } from "@/server/auth/authorization";
import { getAuditRequestContext } from "@/server/http/request-context";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const [context, { id }, body] = await Promise.all([requirePlatformRole(), params, request.json()]); const input = flagOpportunitySchema.parse(body); return apiSuccess(await flagOpportunity(context.user.id, id, input, getAuditRequestContext(request)), { status: 201 }); } catch (error) { return apiError(error); } }
