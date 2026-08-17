import type { SubscriptionPlan } from "@/generated/prisma/enums";

export type PlanEntitlements = {
  opportunityAccessPerMonth: number | null;
  aiRequestsPerHour: number;
  teamSeats: number | null;
  advancedAnalytics: boolean;
  matchIntelligence: boolean;
  aiSalesAssistant: boolean;
  prioritySupport: boolean;
  priorityMatching: boolean;
};

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  FREE: { opportunityAccessPerMonth: 10, aiRequestsPerHour: 10, teamSeats: 2, advancedAnalytics: false, matchIntelligence: false, aiSalesAssistant: false, prioritySupport: false, priorityMatching: false },
  PRO: { opportunityAccessPerMonth: 100, aiRequestsPerHour: 50, teamSeats: 10, advancedAnalytics: true, matchIntelligence: true, aiSalesAssistant: true, prioritySupport: false, priorityMatching: false },
  BUSINESS: { opportunityAccessPerMonth: null, aiRequestsPerHour: 200, teamSeats: null, advancedAnalytics: true, matchIntelligence: true, aiSalesAssistant: true, prioritySupport: true, priorityMatching: false },
};

export function resolveEntitlements(plan: SubscriptionPlan): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan];
}

export function hasEntitlement(plan: SubscriptionPlan, feature: keyof Pick<PlanEntitlements, "advancedAnalytics" | "matchIntelligence" | "aiSalesAssistant" | "prioritySupport" | "priorityMatching">) {
  return PLAN_ENTITLEMENTS[plan][feature];
}

export function resolveEffectivePlan(subscription: {
  plan: SubscriptionPlan;
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  periodEnd: Date | null;
} | null, now = new Date()): SubscriptionPlan {
  if (!subscription || !["TRIALING", "ACTIVE"].includes(subscription.status)) return "FREE";
  if (subscription.periodEnd && subscription.periodEnd <= now) return "FREE";
  return subscription.plan;
}
