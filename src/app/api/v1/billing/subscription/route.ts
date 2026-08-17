import { apiError, apiSuccess } from "@/lib/api-response";
import { getOrganizationSubscription } from "@/modules/billing/service";
import { requireOrganization } from "@/server/auth/authorization";

export async function GET() { try { const context = await requireOrganization(); return apiSuccess(await getOrganizationSubscription(context.organization.id)); } catch (error) { return apiError(error); } }
