import { apiError, apiSuccess } from "@/lib/api-response";
import { decideVerification } from "@/modules/verification/service";
import { requirePlatformRole } from "@/server/auth/authorization";
import { getAuditRequestContext } from "@/server/http/request-context";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const [context, { id }] = await Promise.all([requirePlatformRole(), params]); return apiSuccess(await decideVerification(context.user.id, id, "VERIFIED", undefined, getAuditRequestContext(request))); } catch (error) { return apiError(error); } }
