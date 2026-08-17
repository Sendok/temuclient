import type { AISalesFeature } from "@/modules/ai/sales-schema";
import { requireOrganization, requireProviderOrganization } from "@/server/auth/authorization";
import { enforceAIRateLimit } from "@/server/auth/rate-limit";
import { assertEntitlement, getEffectiveEntitlements } from "@/modules/entitlements/access";

export async function requireAIActor(feature: AISalesFeature, providerOnly = false) {
  const context = providerOnly
    ? await requireProviderOrganization()
    : await requireOrganization();
  const access = await getEffectiveEntitlements(context.organization.id);
  if (context.organization.type !== "BUYER") assertEntitlement(access, "aiSalesAssistant");
  await enforceAIRateLimit({
    userId: context.user.id,
    organizationId: context.organization.id,
    feature,
    plan: access.plan,
  });
  return {
    userId: context.user.id,
    organizationId: context.organization.id,
    role: context.membership.role,
  };
}
