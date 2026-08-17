import type { SubscriptionPlan } from "@/generated/prisma/enums";
import { DomainError } from "@/lib/errors/domain-error";
import { resolveEffectivePlan, resolveEntitlements, type PlanEntitlements } from "@/modules/entitlements/service";
import { db } from "@/server/db/client";

export type EffectiveEntitlements = {
  plan: SubscriptionPlan;
  entitlements: PlanEntitlements;
};

export async function getEffectiveEntitlements(organizationId: string, now = new Date()): Promise<EffectiveEntitlements> {
  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    select: { plan: true, status: true, periodEnd: true },
  });
  const plan = resolveEffectivePlan(subscription, now);
  return { plan, entitlements: resolveEntitlements(plan) };
}

export function assertEntitlement(
  access: EffectiveEntitlements,
  feature: keyof Pick<PlanEntitlements, "advancedAnalytics" | "matchIntelligence" | "aiSalesAssistant" | "prioritySupport">,
) {
  if (!access.entitlements[feature]) {
    throw new DomainError("PLAN_UPGRADE_REQUIRED", "Fitur ini memerlukan paket subscription yang lebih tinggi.", 403);
  }
}

export async function assertTeamSeatAvailable(organizationId: string) {
  const access = await getEffectiveEntitlements(organizationId);
  if (access.entitlements.teamSeats === null) return access;
  const occupiedSeats = await db.organizationMember.count({
    where: { organizationId, status: { in: ["ACTIVE", "INVITED", "SUSPENDED"] } },
  });
  if (occupiedSeats >= access.entitlements.teamSeats) {
    throw new DomainError("TEAM_SEAT_LIMIT_REACHED", `Paket ${access.plan} mendukung maksimal ${access.entitlements.teamSeats} anggota.`, 409);
  }
  return access;
}

export async function consumeOpportunityAccess(organizationId: string, opportunityId: string, now = new Date()) {
  const access = await getEffectiveEntitlements(organizationId, now);
  const limit = access.entitlements.opportunityAccessPerMonth;
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  if (limit === null) {
    await db.entitlementUsage.upsert({
      where: { organizationId_feature_periodStart_entityId: { organizationId, feature: "OPPORTUNITY_ACCESS", periodStart, entityId: opportunityId } },
      update: {}, create: { organizationId, feature: "OPPORTUNITY_ACCESS", periodStart, entityId: opportunityId },
    });
    return { ...access, used: null, limit: null };
  }
  return db.$transaction(async (transaction) => {
    const existing = await transaction.entitlementUsage.findUnique({
      where: { organizationId_feature_periodStart_entityId: { organizationId, feature: "OPPORTUNITY_ACCESS", periodStart, entityId: opportunityId } },
      select: { id: true },
    });
    const used = await transaction.entitlementUsage.count({ where: { organizationId, feature: "OPPORTUNITY_ACCESS", periodStart } });
    if (!existing && used >= limit) throw new DomainError("OPPORTUNITY_ACCESS_LIMIT_REACHED", `Batas ${limit} opportunity untuk paket ${access.plan} bulan ini telah tercapai.`, 403);
    if (!existing) await transaction.entitlementUsage.create({ data: { organizationId, feature: "OPPORTUNITY_ACCESS", periodStart, entityId: opportunityId } });
    return { ...access, used: existing ? used : used + 1, limit };
  }, { isolationLevel: "Serializable" });
}
