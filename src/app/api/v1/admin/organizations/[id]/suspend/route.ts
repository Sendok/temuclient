import { apiError, apiSuccess } from "@/lib/api-response";
import { moderationReasonSchema } from "@/modules/admin/schema";
import { suspendOrganization } from "@/modules/admin/service";
import { requirePlatformRole } from "@/server/auth/authorization";
import { getAuditRequestContext } from "@/server/http/request-context";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const [context, { id }, body] = await Promise.all([requirePlatformRole(["SUPER_ADMIN", "ADMIN"]), params, request.json()]); const input = moderationReasonSchema.parse(body); return apiSuccess(await suspendOrganization(context.user.id, id, input.reason, getAuditRequestContext(request))); } catch (error) { return apiError(error); } }
