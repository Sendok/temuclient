import { apiError, apiSuccess } from "@/lib/api-response";
import { providerProfileUpdateSchema } from "@/modules/provider/schema";
import { getProviderProfile, updateProviderProfile } from "@/modules/provider/service";
import { trackAnalyticsEventOnce } from "@/modules/analytics/service";
import { requireProviderManager, requireProviderOrganization } from "@/server/auth/authorization";

export async function GET() { try { const context = await requireProviderOrganization(); return apiSuccess(await getProviderProfile(context.organization.id, Boolean(context.user.emailVerifiedAt))); } catch (error) { return apiError(error); } }
export async function PATCH(request: Request) { try { const context = await requireProviderManager(); const input = providerProfileUpdateSchema.parse(await request.json()); await updateProviderProfile(context.organization.id, input); const profile = await getProviderProfile(context.organization.id, Boolean(context.user.emailVerifiedAt)); if (profile.profileStrength.percentage === 100) await trackAnalyticsEventOnce({ name: "provider_profile_completed", userId: context.user.id, organizationId: context.organization.id, entityType: "Organization", entityId: context.organization.id }); return apiSuccess(profile); } catch (error) { return apiError(error); } }
