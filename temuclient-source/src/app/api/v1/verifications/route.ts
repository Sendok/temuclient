import { apiError, apiSuccess } from "@/lib/api-response";
import { listOrganizationVerifications } from "@/modules/verification/service";
import { requireOrganization } from "@/server/auth/authorization";

export async function GET() {
  try {
    const context = await requireOrganization();
    return apiSuccess(await listOrganizationVerifications(context.organization.id));
  } catch (error) { return apiError(error); }
}
