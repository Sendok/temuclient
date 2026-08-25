import { describe, expect, it } from "vitest";

import {
  canCancelIntroduction,
  canRequestIntroduction,
  canRespondToIntroduction,
} from "../../src/modules/introductions/permissions";
import {
  assertIntroductionTransition,
  canTransitionIntroduction,
  isActiveIntroductionStatus,
} from "../../src/modules/introductions/state-machine";

describe("Introduction state machine and permissions", () => {
  it("allows only documented REQUESTED transitions", () => {
    for (const status of [
      "ACCEPTED",
      "DECLINED",
      "CANCELLED",
      "EXPIRED",
    ] as const)
      expect(canTransitionIntroduction("REQUESTED", status)).toBe(true);
    expect(canTransitionIntroduction("ACCEPTED", "DECLINED")).toBe(false);
    expect(() =>
      assertIntroductionTransition("DECLINED", "ACCEPTED"),
    ).toThrowError(/tidak dapat berubah/);
  });

  it("defines active duplicate states", () => {
    expect(isActiveIntroductionStatus("REQUESTED")).toBe(true);
    expect(isActiveIntroductionStatus("ACCEPTED")).toBe(true);
    expect(isActiveIntroductionStatus("DECLINED")).toBe(false);
    expect(isActiveIntroductionStatus("CANCELLED")).toBe(false);
  });

  it("allows Provider Sales to request/cancel and only Buyer managers to respond", () => {
    expect(canRequestIntroduction("SALES")).toBe(true);
    expect(canCancelIntroduction("SALES")).toBe(true);
    expect(canRequestIntroduction("MEMBER")).toBe(false);
    expect(canRespondToIntroduction("OWNER")).toBe(true);
    expect(canRespondToIntroduction("ADMIN")).toBe(true);
    expect(canRespondToIntroduction("SALES")).toBe(false);
  });
});
