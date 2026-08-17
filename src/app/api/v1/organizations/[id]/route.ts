import { apiError, apiSuccess } from "@/lib/api-response";
import { updateOrganizationSchema } from "@/modules/organizations/schema";
import { updateOrganization } from "@/modules/organizations/service";
import { requireOrganization, requireOrganizationRole } from "@/server/auth/authorization";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { organization, membership } = await requireOrganization(id);
    return apiSuccess({ organization, membership: { role: membership.role, status: membership.status } });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireOrganizationRole(["OWNER", "ADMIN"], id);
    const input = updateOrganizationSchema.parse(await request.json());
    return apiSuccess(await updateOrganization(id, input));
  } catch (error) {
    return apiError(error);
  }
}
