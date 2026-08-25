import { apiError, apiSuccess } from "@/lib/api-response";
import { updateOrganizationServiceSchema } from "@/modules/services/schema";
import { deleteOrganizationService, updateOrganizationService } from "@/modules/services/service";
import { requireProviderManager } from "@/server/auth/authorization";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireProviderManager()]); const input = updateOrganizationServiceSchema.parse(await request.json()); return apiSuccess(await updateOrganizationService(context.organization.id, id, input)); } catch (error) { return apiError(error); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireProviderManager()]); await deleteOrganizationService(context.organization.id, id); return apiSuccess({ deleted: true }); } catch (error) { return apiError(error); } }
