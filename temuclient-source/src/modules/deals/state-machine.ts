import type { DealStage } from "@/generated/prisma/enums";
import { DomainError } from "@/lib/errors/domain-error";

const activeNext: Partial<Record<DealStage, DealStage>> = {
  INTRODUCTION: "DISCOVERY",
  DISCOVERY: "PROPOSAL",
  PROPOSAL: "NEGOTIATION",
};

export function canAdvanceDeal(from: DealStage, to: DealStage) {
  return activeNext[from] === to;
}

export function canMarkDealWon(stage: DealStage) {
  return stage === "NEGOTIATION";
}

export function canMarkDealLost(stage: DealStage) {
  return ["INTRODUCTION", "DISCOVERY", "PROPOSAL", "NEGOTIATION"].includes(stage);
}

export function assertDealAdvance(from: DealStage, to: DealStage) {
  if (!canAdvanceDeal(from, to))
    throw new DomainError(
      "DEAL_INVALID_STATE",
      `Deal tidak dapat berpindah dari ${from} ke ${to}.`,
      409,
    );
}

export function stageProbability(stage: DealStage) {
  const values: Record<DealStage, number> = {
    INTRODUCTION: 10,
    DISCOVERY: 30,
    PROPOSAL: 60,
    NEGOTIATION: 80,
    WON: 100,
    LOST: 0,
  };
  return values[stage];
}
