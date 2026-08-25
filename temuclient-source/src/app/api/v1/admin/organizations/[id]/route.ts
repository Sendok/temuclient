import { apiError, apiSuccess } from "@/lib/api-response";
import { getAdminOrganization } from "@/modules/admin/service";
import { requirePlatformRole } from "@/server/auth/authorization";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { await requirePlatformRole(); const { id } = await params; return apiSuccess(await getAdminOrganization(id)); } catch (error) { return apiError(error); } }
