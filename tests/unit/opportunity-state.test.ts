import { describe, expect, it } from "vitest";

import { assertPublishable, getPublishMissingFields } from "../../src/modules/opportunities/publish-validation";
import { assertOpportunityTransition, canTransitionOpportunity } from "../../src/modules/opportunities/state-machine";

describe("Opportunity lifecycle", () => {
  it("allows only documented state transitions", () => {
    expect(canTransitionOpportunity("DRAFT", "REVIEW")).toBe(true);
    expect(canTransitionOpportunity("REVIEW", "ACTIVE")).toBe(true);
    expect(canTransitionOpportunity("ACTIVE", "PAUSED")).toBe(true);
    expect(canTransitionOpportunity("WON", "ACTIVE")).toBe(false);
    expect(() => assertOpportunityTransition("CANCELLED", "ACTIVE")).toThrow("Opportunity tidak dapat berpindah");
  });

  it("returns field-level publish requirements", () => {
    const incomplete = { title: "New", serviceCategoryId: null, industryId: null, problemStatement: "short", projectType: null, country: "", city: null, buyerOrganizationId: "org" };
    expect(getPublishMissingFields(incomplete)).toEqual(["title", "serviceCategoryId", "industryId", "problemStatement", "projectType", "country", "city"]);
    expect(() => assertPublishable(incomplete, "ACTIVE")).toThrow("Lengkapi field wajib");
  });
});
