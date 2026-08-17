import { afterAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("Phase 1 foundation persistence and tenant isolation", async () => {
  const { db } = await import("../../src/server/db/client");
  const { register } = await import("../../src/modules/auth/service");
  const { createOrganizationWithOwner, updateOrganization } = await import("../../src/modules/organizations/service");
  const { getOrganizationContextForUser } = await import("../../src/server/auth/authorization");
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const userIds: string[] = [];
  const organizationIds: string[] = [];

  afterAll(async () => {
    if (organizationIds.length) await db.organization.deleteMany({ where: { id: { in: organizationIds } } });
    if (userIds.length) await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });

  it("registers users, creates organizations, and creates active owner memberships transactionally", async () => {
    const registered = await register({ name: "Provider Test", email: `provider-${nonce}@example.test`, password: "ValidPass123" });
    userIds.push(registered.user.id);
    const created = await createOrganizationWithOwner(registered.user.id, registered.session.session.id, { name: "Provider Integration", type: "PROVIDER", city: "Jakarta", description: "Perusahaan pengujian integrasi TemuClient yang valid." });
    organizationIds.push(created.organization.id);
    expect(created.membership).toMatchObject({ role: "OWNER", status: "ACTIVE", userId: registered.user.id });
    const persisted = await db.session.findUnique({ where: { id: registered.session.session.id } });
    expect(persisted?.activeOrganizationId).toBe(created.organization.id);
  });

  it("allows an authorized owner update and rejects cross-organization access", async () => {
    const first = await register({ name: "Owner A", email: `owner-a-${nonce}@example.test`, password: "ValidPass123" });
    const second = await register({ name: "Owner B", email: `owner-b-${nonce}@example.test`, password: "ValidPass123" });
    userIds.push(first.user.id, second.user.id);
    const orgA = await createOrganizationWithOwner(first.user.id, first.session.session.id, { name: "Tenant A", type: "BUYER", city: "Bandung", description: "Organisasi pembeli untuk pengujian isolasi tenant." });
    const orgB = await createOrganizationWithOwner(second.user.id, second.session.session.id, { name: "Tenant B", type: "PROVIDER", city: "Surabaya", description: "Organisasi provider untuk pengujian isolasi tenant." });
    organizationIds.push(orgA.organization.id, orgB.organization.id);

    const context = await getOrganizationContextForUser(first.user.id, orgA.organization.id);
    expect(context.membership.role).toBe("OWNER");
    const updated = await updateOrganization(orgA.organization.id, { city: "Yogyakarta" });
    expect(updated.city).toBe("Yogyakarta");

    await expect(getOrganizationContextForUser(first.user.id, orgB.organization.id)).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
  });
});
