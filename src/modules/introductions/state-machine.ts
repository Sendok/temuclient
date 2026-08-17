import type { IntroductionStatus } from "@/generated/prisma/enums";
import { DomainError } from "@/lib/errors/domain-error";

const transitions: Record<IntroductionStatus, readonly IntroductionStatus[]> = {
  REQUESTED: ["ACCEPTED", "DECLINED", "CANCELLED", "EXPIRED"],
  ACCEPTED: [],
  DECLINED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function canTransitionIntroduction(
  from: IntroductionStatus,
  to: IntroductionStatus,
) {
  return transitions[from].includes(to);
}
export function assertIntroductionTransition(
  from: IntroductionStatus,
  to: IntroductionStatus,
) {
  if (!canTransitionIntroduction(from, to))
    throw new DomainError(
      "INTRODUCTION_INVALID_STATE",
      `Introduction tidak dapat berubah dari ${from} ke ${to}.`,
      409,
    );
}
export function isActiveIntroductionStatus(status: IntroductionStatus) {
  return status === "REQUESTED" || status === "ACCEPTED";
}
