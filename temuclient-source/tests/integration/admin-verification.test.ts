import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("Phase 9 verification, moderation, suspension, and audit persistence", async () => {
  const { db } = await import("../../src/server/db/client");
  const { requestVerification, decideVerification } = await import("../../src/modules/verification/service");
  const { flagOpportunity, suspendOrganization } = await import("../../src/modules/admin/service");
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let admin: { id: string };
  let owner: { id: string };
  let organization: { id: string };

  beforeAll(async () => {
    admin = await db.user.create({ data: { name: "Phase 9 Admin", email: `admin-${nonce}@example.test`, platformRole: "ADMIN" } });
    owner = await db.user.create({ data: { name: "Phase 9 Owner", email: `owner-${nonce}@example.test` } });
    organization = await db.organization.create({ data: { name: "Phase 9 Provider", slug: `phase-9-provider-${nonce}`, type: "PROVIDER", website: "https://provider.example.test", businessEmail: `hello-${nonce}@provider.example.test` } });
    await db.organizationMember.create({ data: { organizationId: organization.id, userId: owner.id, role: "OWNER" } });
  });

  afterAll(async () => {
    await db.riskFlag.deleteMany({ where: { createdById: admin.id } });
    await db.notification.deleteMany({ where: { userId: owner.id } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: [admin.id, owner.id] } }, { actorOrganizationId: organization.id }] } });
    await db.verification.deleteMany({ where: { organizationId: organization.id } });
    await db.organization.delete({ where: { id: organization.id } });
    await db.user.deleteMany({ where: { id: { in: [admin.id, owner.id] } } });
    await db.$disconnect();
  });

  it("requests and approves an independent verification with audit and notification", async () => {
    const requested = await requestVerification(organization.id, owner.id, { type: "COMPANY", entityType: "ORGANIZATION", entityId: organization.id, evidence: { registration: "AHU-TEST" } }, { ipAddress: "127.0.0.1", userAgent: "vitest" });
    expect(requested.status).toBe("PENDING");
    const approved = await decideVerification(admin.id, requested.id, "VERIFIED", undefined, { ipAddress: "127.0.0.1", userAgent: "vitest" });
    expect(approved.status).toBe("VERIFIED");
    expect(await db.auditLog.count({ where: { entityId: requested.id, action: { in: ["VERIFICATION_REQUESTED", "VERIFICATION_APPROVED"] } } })).toBe(2);
    expect(await db.notification.count({ where: { entityId: requested.id, type: "VERIFICATION" } })).toBe(1);
  });

  it("rejects a separate verification attempt and preserves the reason", async () => {
    const requested = await requestVerification(organization.id, owner.id, { type: "DOMAIN", entityType: "ORGANIZATION", entityId: organization.id });
    const rejected = await decideVerification(admin.id, requested.id, "REJECTED", "Domain belum mengarah ke identitas perusahaan yang diajukan.");
    expect(rejected).toMatchObject({ status: "REJECTED", notes: "Domain belum mengarah ke identitas perusahaan yang diajukan." });
  });

  it("persists manual risk flags and suspends with immutable audit evidence", async () => {
    const opportunity = await db.opportunity.findFirstOrThrow({ where: { status: "ACTIVE" } });
    const flag = await flagOpportunity(admin.id, opportunity.id, { signal: "MANUAL_REVIEW", severity: "HIGH", reason: "Submission memiliki sinyal yang memerlukan pemeriksaan manual lebih lanjut." });
    expect(flag.opportunityId).toBe(opportunity.id);
    const suspended = await suspendOrganization(admin.id, organization.id, "Repeated verification discrepancy requires platform review.");
    expect(suspended.status).toBe("SUSPENDED");
    expect(await db.auditLog.count({ where: { actorUserId: admin.id, action: { in: ["OPPORTUNITY_FLAGGED", "ORGANIZATION_SUSPENDED"] } } })).toBe(2);
  });
});
