import { apiError, apiSuccess } from "@/lib/api-response";
import { createOrganizationServiceSchema } from "@/modules/services/schema";
import { createOrganizationService, listOrganizationServices } from "@/modules/services/service";
import { requireProviderManager, requireProviderOrganization } from "@/server/auth/authorization";

export async function GET() { try { const context = await requireProviderOrganization(); return apiSuccess(await listOrganizationServices(context.organization.id)); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { const context = await requireProviderManager(); const input = createOrganizationServiceSchema.parse(await request.json()); return apiSuccess(await createOrganizationService(context.organization.id, input), { status: 201 }); } catch (error) { return apiError(error); } }
