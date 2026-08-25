import { apiError, apiSuccess } from "@/lib/api-response";
import { verificationRequestSchema } from "@/modules/verification/schema";
import { requestVerification } from "@/modules/verification/service";
import { requireMutableOrganizationRole } from "@/server/auth/authorization";
import { getAuditRequestContext } from "@/server/http/request-context";

export async function POST(request: Request) {
  try {
    const context = await requireMutableOrganizationRole(["OWNER", "ADMIN"]);
    const input = verificationRequestSchema.parse(await request.json());
    return apiSuccess(await requestVerification(context.organization.id, context.user.id, input, getAuditRequestContext(request)), { status: 201 });
  } catch (error) { return apiError(error); }
}
