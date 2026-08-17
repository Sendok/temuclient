import { describe, expect, it } from "vitest";

import { hasOrganizationRole, isOrganizationType } from "../../src/lib/permissions/organization";

describe("organization permission helpers", () => {
  it("accepts only explicitly allowed organization roles", () => {
    expect(hasOrganizationRole("OWNER", ["OWNER", "ADMIN"])).toBe(true);
    expect(hasOrganizationRole("SALES", ["OWNER", "ADMIN"])).toBe(false);
  });

  it("permits hybrid organizations for either product shell", () => {
    expect(isOrganizationType("PROVIDER", "PROVIDER")).toBe(true);
    expect(isOrganizationType("BUYER", "PROVIDER")).toBe(false);
    expect(isOrganizationType("HYBRID", "PROVIDER")).toBe(true);
    expect(isOrganizationType("HYBRID", "BUYER")).toBe(true);
  });
});
