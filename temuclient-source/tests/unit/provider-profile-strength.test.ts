import { describe, expect, it } from "vitest";

import { calculateProfileStrength } from "../../src/modules/provider/profile-strength";

const complete = { company: { name: "Provider", description: "Deskripsi perusahaan yang lengkap.", city: "Jakarta" }, services: [{ minProjectValue: BigInt(50_000_000), maxProjectValue: BigInt(500_000_000) }], industryCount: 2, portfolioCount: 1, teamCapacity: 5, availability: "AVAILABLE", emailVerified: true };

describe("deterministic Provider Profile Strength", () => {
  it("returns 100 with the documented factor weights for a complete profile", () => {
    expect(calculateProfileStrength(complete)).toEqual({ percentage: 100, missingItems: [], nextRecommendedAction: null, breakdown: { companyBasics: 20, services: 20, industries: 10, projectRange: 10, portfolio: 25, teamCapacity: 10, verification: 5 } });
  });

  it("returns ordered missing actions without using AI", () => {
    const result = calculateProfileStrength({ company: { name: "Provider", description: null, city: null }, services: [], industryCount: 0, portfolioCount: 0, teamCapacity: null, availability: null, emailVerified: false });
    expect(result.percentage).toBe(0);
    expect(result.nextRecommendedAction).toBe("Lengkapi informasi dasar perusahaan");
    expect(result.missingItems).toHaveLength(7);
  });
});
