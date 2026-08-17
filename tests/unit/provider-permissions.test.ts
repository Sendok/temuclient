import { describe, expect, it } from "vitest";

import { canManageProviderCapability, canReadProviderCapability } from "../../src/modules/provider/permissions";

describe("Provider capability permissions", () => {
  it.each(["OWNER", "ADMIN"] as const)("allows %s to manage capability", (role) => expect(canManageProviderCapability(role)).toBe(true));
  it.each(["SALES", "MEMBER"] as const)("keeps %s read-only", (role) => {
    expect(canReadProviderCapability(role)).toBe(true);
    expect(canManageProviderCapability(role)).toBe(false);
  });
});
