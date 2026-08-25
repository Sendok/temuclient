import type { OpportunityStatus } from "@/generated/prisma/enums";
import { DomainError } from "@/lib/errors/domain-error";

const allowed: Record<OpportunityStatus, readonly OpportunityStatus[]> = {
  DRAFT: ["REVIEW", "CANCELLED"], REVIEW: ["DRAFT", "ACTIVE", "CANCELLED"], ACTIVE: ["PAUSED", "MATCHING", "CANCELLED", "EXPIRED"], PAUSED: ["ACTIVE", "CANCELLED", "EXPIRED"], MATCHING: ["PAUSED", "IN_DISCUSSION", "CANCELLED", "EXPIRED"], IN_DISCUSSION: ["WON", "CANCELLED"], WON: [], CANCELLED: [], EXPIRED: ["ACTIVE"],
};

export function canTransitionOpportunity(from: OpportunityStatus, to: OpportunityStatus) { return allowed[from].includes(to); }
export function assertOpportunityTransition(from: OpportunityStatus, to: OpportunityStatus) { if (!canTransitionOpportunity(from, to)) throw new DomainError("OPPORTUNITY_INVALID_STATE", `Opportunity tidak dapat berpindah dari ${from} ke ${to}.`, 409); }
