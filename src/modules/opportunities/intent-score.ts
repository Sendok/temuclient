import type { OpportunityIntentLevel } from "@/generated/prisma/enums";

export const BUYER_INTENT_VERSION = "buyer-intent-v1";
export type BuyerIntentInput = { title: string; serviceCategoryId: string | null; industryId: string | null; problemStatement: string; businessObjective: string | null; projectType: string | null; requirementCount: number; budgetMin: bigint | null; budgetMax: bigint | null; budgetStatus: string | null; timelineStart: Date | null; timelineEnd: Date | null; decisionMakerInvolved: boolean; companyBusinessEmail: boolean; accountEmailVerified: boolean; reviewed: boolean; now?: Date };

export function calculateBuyerIntent(input: BuyerIntentInput) {
  const completenessChecks = [input.title.length >= 5, Boolean(input.serviceCategoryId), Boolean(input.industryId), input.problemStatement.length >= 20, Boolean(input.businessObjective), Boolean(input.projectType), input.requirementCount > 0];
  const requirementCompleteness = Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * 20);
  const budget = input.budgetMin !== null && input.budgetMax !== null ? input.budgetStatus === "APPROVED" ? 20 : 15 : input.budgetStatus && input.budgetStatus !== "UNDISCLOSED" ? 8 : 0;
  const timeline = input.timelineStart && input.timelineEnd ? 15 : input.timelineStart || input.timelineEnd ? 7 : 0;
  const decisionMaker = input.decisionMakerInvolved ? 15 : 0;
  const companyVerification = (input.companyBusinessEmail ? 5 : 0) + (input.accountEmailVerified ? 5 : 0);
  const activity = input.reviewed ? 10 : 5;
  const daysUntilStart = input.timelineStart ? Math.ceil((input.timelineStart.getTime() - (input.now ?? new Date()).getTime()) / 86_400_000) : null;
  const urgency = daysUntilStart !== null && daysUntilStart <= 30 ? 10 : daysUntilStart !== null && daysUntilStart <= 90 ? 5 : 0;
  const breakdown = { requirementCompleteness, budget, timeline, decisionMaker, companyVerification, activity, urgency };
  const score = Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  const level: OpportunityIntentLevel = score >= 80 ? "VERY_HIGH" : score >= 60 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  return { score, level, version: BUYER_INTENT_VERSION, breakdown };
}
