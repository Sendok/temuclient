import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("Provider capability persistence and isolation", async () => {
  const { db } = await import("../../src/server/db/client");
  const { register } = await import("../../src/modules/auth/service");
  const { createOrganizationWithOwner } = await import("../../src/modules/organizations/service");
  const { createOrganizationService, updateOrganizationService } = await import("../../src/modules/services/service");
  const { createPortfolio, getPortfolio, listPortfolios, updatePortfolio } = await import("../../src/modules/portfolio/service");
  const { getProviderProfile, updateProviderProfile } = await import("../../src/modules/provider/service");
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const userIds: string[] = [];
  const organizationIds: string[] = [];
  let organizationA = "";
  let organizationB = "";
  let categoryId = "";
  let industryId = "";
  let technologyId = "";

  beforeAll(async () => {
    const [userA, userB] = await Promise.all([
      register({ name: "Provider Capability A", email: `cap-a-${nonce}@example.test`, password: "ValidPass123" }),
      register({ name: "Provider Capability B", email: `cap-b-${nonce}@example.test`, password: "ValidPass123" }),
    ]);
    userIds.push(userA.user.id, userB.user.id);
    const [orgA, orgB] = await Promise.all([
      createOrganizationWithOwner(userA.user.id, userA.session.session.id, { name: `Capability A ${nonce}`, type: "PROVIDER", city: "Jakarta", description: "Provider integration test organization with complete company basics." }),
      createOrganizationWithOwner(userB.user.id, userB.session.session.id, { name: `Capability B ${nonce}`, type: "PROVIDER", city: "Bandung", description: "Second provider organization used to prove tenant isolation." }),
    ]);
    organizationA = orgA.organization.id; organizationB = orgB.organization.id; organizationIds.push(organizationA, organizationB);
    const [category, industry, technology] = await Promise.all([db.serviceCategory.findFirstOrThrow(), db.industry.findFirstOrThrow(), db.technology.findFirstOrThrow()]);
    categoryId = category.id; industryId = industry.id; technologyId = technology.id;
  });

  afterAll(async () => {
    if (organizationIds.length) await db.organization.deleteMany({ where: { id: { in: organizationIds } } });
    if (userIds.length) await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });

  it("creates and updates an organization-scoped service", async () => {
    const created = await createOrganizationService(organizationA, { serviceCategoryId: categoryId, description: "Enterprise software delivery.", minProjectValue: BigInt(50_000_000), maxProjectValue: BigInt(500_000_000), currency: "IDR", typicalDurationMin: 2, typicalDurationMax: 8, isPrimary: true });
    expect(created.minProjectValue).toBe("50000000");
    const updated = await updateOrganizationService(organizationA, created.id, { maxProjectValue: BigInt(750_000_000) });
    expect(updated.maxProjectValue).toBe("750000000");
    await expect(updateOrganizationService(organizationB, created.id, { description: "Cross tenant mutation" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("persists industries and an NDA-safe portfolio projection", async () => {
    await updateProviderProfile(organizationA, { industrySelections: [{ industryId, experienceLevel: "EXPERT" }], teamCapacity: 6, availability: "AVAILABLE" });
    const created = await createPortfolio(organizationA, { title: "Confidential Transformation", clientName: "Secret Client PT", isClientConfidential: true, industryId, problem: "Operational workflows were fragmented across many disconnected systems.", solution: "A secure integrated platform unified workflows and operational reporting.", outcome: "Cycle time improved without exposing confidential client information.", projectValueMin: BigInt(100_000_000), projectValueMax: BigInt(400_000_000), currency: "IDR", durationMonths: 5, status: "PUBLISHED", technologyIds: [technologyId] });
    expect(created.clientDisplayName).toMatch(/^Confidential .+ Company$/);
    expect(JSON.stringify(created)).not.toContain("Secret Client PT");
    expect(JSON.stringify(await listPortfolios(organizationA))).not.toContain("Secret Client PT");
    const ownerView = await getPortfolio(organizationA, created.id);
    expect(ownerView.clientName).toBe("Secret Client PT");
    const updated = await updatePortfolio(organizationA, created.id, { outcome: "Updated measurable business outcome." });
    expect(updated.outcome).toBe("Updated measurable business outcome.");
    await expect(getPortfolio(organizationB, created.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const profile = await getProviderProfile(organizationA, true);
    expect(profile.industries).toHaveLength(1);
    expect(profile.portfolios).toHaveLength(1);
    expect(profile.profileStrength.percentage).toBeGreaterThanOrEqual(80);
  });
});
