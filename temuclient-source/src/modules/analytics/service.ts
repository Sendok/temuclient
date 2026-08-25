import type { Prisma } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { db } from "@/server/db/client";
import { assertEntitlement, getEffectiveEntitlements } from "@/modules/entitlements/access";

export const ANALYTICS_EVENTS = ["user_registered", "role_selected", "organization_created", "provider_profile_completed", "opportunity_created", "opportunity_published", "opportunity_viewed", "opportunity_saved", "introduction_requested", "introduction_accepted", "message_sent", "meeting_created", "proposal_submitted", "deal_won", "deal_lost"] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type TrackEventInput = { name: AnalyticsEventName; userId?: string; organizationId?: string; entityType?: string; entityId?: string; properties?: Prisma.InputJsonValue; occurredAt?: Date };

export async function trackAnalyticsEvent(input: TrackEventInput, transaction: Prisma.TransactionClient = db) {
  const event = await transaction.analyticsEvent.create({ data: { name: input.name, userId: input.userId, organizationId: input.organizationId, entityType: input.entityType, entityId: input.entityId, propertiesJson: input.properties, occurredAt: input.occurredAt } });
  return event;
}

export async function trackAnalyticsEventOnce(input: TrackEventInput) {
  const existing = await db.analyticsEvent.findFirst({
    where: {
      name: input.name,
      userId: input.userId,
      organizationId: input.organizationId,
      entityType: input.entityType,
      entityId: input.entityId,
    },
    select: { id: true },
  });
  return existing ?? trackAnalyticsEvent(input);
}

export async function deliverAnalyticsEvent(input: TrackEventInput) {
  const env = getServerEnv();
  const event = await trackAnalyticsEvent(input);
  if (env.ANALYTICS_PROVIDER === "http" && env.ANALYTICS_ENDPOINT && env.ANALYTICS_WRITE_KEY) {
    try {
      const response = await fetch(env.ANALYTICS_ENDPOINT, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.ANALYTICS_WRITE_KEY}` }, body: JSON.stringify({ id: event.id, ...input, occurredAt: event.occurredAt.toISOString() }) });
      if (!response.ok) throw new Error(`Analytics provider returned ${response.status}`);
    } catch (error) { logger.warn("analytics_delivery_failed", { eventId: event.id, error }); }
  }
  return event;
}

export async function getFunnelMetrics(from: Date, to: Date) {
  const names: AnalyticsEventName[] = ["opportunity_published", "introduction_requested", "introduction_accepted", "meeting_created", "proposal_submitted", "deal_won"];
  const [rows, matchesGenerated] = await Promise.all([
    db.analyticsEvent.groupBy({ by: ["name"], where: { name: { in: names }, occurredAt: { gte: from, lt: to } }, _count: { id: true } }),
    db.opportunityMatch.count({ where: { calculatedAt: { gte: from, lt: to } } }),
  ]);
  const counts = Object.fromEntries(names.map((name) => [name, rows.find((row) => row.name === name)?._count.id ?? 0])) as Record<(typeof names)[number], number>;
  return { ...counts, matchesGenerated, qualifiedIntroductions: counts.introduction_accepted };
}

export async function getOrganizationAnalytics(organizationId: string, from: Date, to: Date) {
  const access = await getEffectiveEntitlements(organizationId);
  assertEntitlement(access, "advancedAnalytics");
  const names: AnalyticsEventName[] = ["opportunity_viewed", "opportunity_saved", "introduction_requested", "introduction_accepted", "meeting_created", "proposal_submitted", "deal_won"];
  const rows = await db.analyticsEvent.groupBy({ by: ["name"], where: { organizationId, name: { in: names }, occurredAt: { gte: from, lt: to } }, _count: { id: true } });
  const counts = Object.fromEntries(names.map((name) => [name, rows.find((row) => row.name === name)?._count.id ?? 0])) as Record<(typeof names)[number], number>;
  return { ...counts, qualifiedIntroductions: counts.introduction_accepted };
}
