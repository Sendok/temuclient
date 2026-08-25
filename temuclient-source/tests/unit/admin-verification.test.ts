import { describe, expect, it } from "vitest";

import { assertOrganizationCanMutate, assertPlatformRole, canModerate, canSuspendOrganization } from "../../src/modules/admin/permissions";
import { verificationRequestSchema } from "../../src/modules/verification/schema";
import { isValidVerificationDecision } from "../../src/modules/verification/service";
import { deriveRiskSignals } from "../../src/modules/admin/service";

describe("Phase 9 platform RBAC, verification, and suspension rules", () => {
  it("keeps platform RBAC independent and restricts suspension", () => {
    expect(canModerate("MODERATOR")).toBe(true);
    expect(canSuspendOrganization("MODERATOR")).toBe(false);
    expect(canSuspendOrganization("ADMIN")).toBe(true);
    expect(() => assertPlatformRole(null)).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    expect(() => assertPlatformRole("MODERATOR", ["SUPER_ADMIN", "ADMIN"])).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("only allows a pending verification to be approved or rejected", () => {
    expect(isValidVerificationDecision("PENDING", "VERIFIED")).toBe(true);
    expect(isValidVerificationDecision("PENDING", "REJECTED")).toBe(true);
    expect(isValidVerificationDecision("VERIFIED", "REJECTED")).toBe(false);
    expect(isValidVerificationDecision("REJECTED", "VERIFIED")).toBe(false);
  });

  it("validates independent entity/type boundaries", () => {
    expect(verificationRequestSchema.safeParse({ type: "DOMAIN", entityType: "ORGANIZATION", entityId: "cm12345678901234567890123" }).success).toBe(true);
    expect(verificationRequestSchema.safeParse({ type: "BUDGET", entityType: "ORGANIZATION", entityId: "cm12345678901234567890123" }).success).toBe(false);
  });

  it("blocks commercial mutations for suspended organizations", () => {
    expect(() => assertOrganizationCanMutate("ACTIVE")).not.toThrow();
    expect(() => assertOrganizationCanMutate("SUSPENDED")).toThrowError(expect.objectContaining({ code: "ORGANIZATION_SUSPENDED", status: 403 }));
  });

  it("derives lightweight deterministic risk signals without ML", () => {
    const signals = deriveRiskSignals({ website: "https://vendor.example", businessEmail: "ops@different.example", status: "SUSPENDED", verifications: [{ status: "REJECTED" }, { status: "REJECTED" }], buyerOpportunities: [{ title: "ERP Rollout" }, { title: "erp rollout" }] });
    expect(signals.map((item) => item.signal)).toEqual(expect.arrayContaining(["ACCOUNT_STATUS", "DOMAIN_MISMATCH", "REPEATED_REJECTION", "DUPLICATE_SUBMISSION"]));
  });
});
