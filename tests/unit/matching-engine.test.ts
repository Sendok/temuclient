import { describe, expect, it } from "vitest";

import { deterministicMatchingEngine, isBudgetViable } from "../../src/modules/matching/engine";
import { MATCHING_ALGORITHM_VERSION, MATCH_WEIGHTS, type MatchOpportunityInput, type MatchProviderInput } from "../../src/modules/matching/types";

const opportunity: MatchOpportunityInput = { serviceCategoryId: "software", industryId: "logistics", budgetMin: BigInt(250_000_000), budgetMax: BigInt(400_000_000), province: "DKI Jakarta", city: "Jakarta", remoteAllowed: false, text: "TypeScript warehouse inventory integration platform" };
const provider: MatchProviderInput = { services: [{ serviceCategoryId: "software", minProjectValue: BigInt(100_000_000), maxProjectValue: BigInt(500_000_000) }], industryIds: ["logistics"], portfolios: [{ industryId: "logistics", text: "warehouse inventory integration platform", technologyNames: ["TypeScript"] }], teamCapacity: 12, province: "DKI Jakarta", city: "Jakarta", availability: "AVAILABLE" };

describe("Matching Engine V1", () => {
  it("applies every documented factor weight and produces a deterministic total", () => {
    const result = deterministicMatchingEngine.calculate(opportunity, provider);
    expect(result.factors).toEqual(MATCH_WEIGHTS);
    expect(result.totalScore).toBe(100);
    expect(result.reasons).toHaveLength(8);
    expect(result.algorithmVersion).toBe(MATCHING_ALGORITHM_VERSION);
  });

  it("scores factor degradation independently without allowing AI input", () => {
    const result = deterministicMatchingEngine.calculate({ ...opportunity, city: "Surabaya", province: "Jawa Timur", remoteAllowed: true, text: "general platform" }, { ...provider, industryIds: [], portfolios: [], teamCapacity: 2, availability: "LIMITED" });
    expect(result.factors.service).toBe(25);
    expect(result.factors.industry).toBe(0);
    expect(result.factors.portfolio).toBe(0);
    expect(result.factors.technology).toBe(0);
    expect(result.factors.capacity).toBe(6);
    expect(result.factors.location).toBe(2);
    expect(result.factors.availability).toBe(3);
    expect(result.totalScore).toBe(Object.values(result.factors).reduce((sum, score) => sum + score, 0));
  });

  it("filters candidates whose known project range cannot overlap the buyer budget", () => {
    expect(isBudgetViable(opportunity, provider.services[0])).toBe(true);
    expect(isBudgetViable(opportunity, { serviceCategoryId: "software", minProjectValue: BigInt(500_000_001), maxProjectValue: BigInt(900_000_000) })).toBe(false);
    expect(isBudgetViable({ budgetMin: null, budgetMax: null }, provider.services[0])).toBe(true);
  });
});
