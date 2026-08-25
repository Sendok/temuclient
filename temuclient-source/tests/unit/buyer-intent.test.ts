import { describe, expect, it } from "vitest";

import { calculateBuyerIntent } from "../../src/modules/opportunities/intent-score";

describe("Buyer Intent V1", () => {
  it("uses the documented deterministic weights and level thresholds", () => {
    const result = calculateBuyerIntent({ title: "Warehouse Management System", serviceCategoryId: "service", industryId: "industry", problemStatement: "Inventory visibility is fragmented across five warehouse operations.", businessObjective: "Improve inventory accuracy", projectType: "NEW_DEVELOPMENT", requirementCount: 2, budgetMin: BigInt(250_000_000), budgetMax: BigInt(400_000_000), budgetStatus: "APPROVED", timelineStart: new Date("2026-08-25T00:00:00Z"), timelineEnd: new Date("2027-01-31T00:00:00Z"), decisionMakerInvolved: true, companyBusinessEmail: true, accountEmailVerified: true, reviewed: true, now: new Date("2026-08-10T00:00:00Z") });
    expect(result.score).toBe(100);
    expect(result.level).toBe("VERY_HIGH");
    expect(result.breakdown).toEqual({ requirementCompleteness: 20, budget: 20, timeline: 15, decisionMaker: 15, companyVerification: 10, activity: 10, urgency: 10 });
  });

  it("maps lower scores without AI", () => {
    const result = calculateBuyerIntent({ title: "Draft", serviceCategoryId: null, industryId: null, problemStatement: "A sufficiently described draft business problem.", businessObjective: null, projectType: null, requirementCount: 0, budgetMin: null, budgetMax: null, budgetStatus: null, timelineStart: null, timelineEnd: null, decisionMakerInvolved: false, companyBusinessEmail: false, accountEmailVerified: false, reviewed: false });
    expect(result.level).toBe("LOW");
    expect(result.score).toBeLessThan(40);
  });
});
