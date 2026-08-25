import { apiError, apiSuccess } from "@/lib/api-response";
import { moderationReasonSchema } from "@/modules/admin/schema";
import { decideVerification } from "@/modules/verification/service";
import { requirePlatformRole } from "@/server/auth/authorization";
import { getAuditRequestContext } from "@/server/http/request-context";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const [context, { id }, body] = await Promise.all([requirePlatformRole(), params, request.json()]); const { reason } = moderationReasonSchema.parse(body); return apiSuccess(await decideVerification(context.user.id, id, "REJECTED", reason, getAuditRequestContext(request))); } catch (error) { return apiError(error); } }
