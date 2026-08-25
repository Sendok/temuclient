import { describe, expect, it } from "vitest";

import { opportunities, providers } from "../../src/data/mock";

describe("prototype mock adapters", () => {
  it("provides at least twenty unique Indonesian B2B opportunities", () => {
    expect(opportunities).toHaveLength(20);
    expect(new Set(opportunities.map((item) => item.id))).toHaveLength(20);
    expect(opportunities.some((item) => item.city === "Surabaya")).toBe(true);
  });

  it("keeps provider feed view models free of buyer contact fields", () => {
    const serialized = JSON.stringify(opportunities);
    expect(serialized).not.toContain("buyerEmail");
    expect(serialized).not.toContain("phone");
    expect(serialized).not.toContain("decisionMaker");
  });

  it("uses fictional Indonesian provider examples", () => {
    expect(providers.map((item) => item.name)).toContain("Sagara Software");
    expect(providers.map((item) => item.name)).not.toContain("Acme Inc");
  });
});
