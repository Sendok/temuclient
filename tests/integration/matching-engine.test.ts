import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("Matching persistence, ordering, privacy, and save behavior", async () => {
  const { db } = await import("../../src/server/db/client");
  const { getProviderOpportunity, listBuyerOpportunityMatches, listProviderOpportunityFeed, saveOpportunity, unsaveOpportunity } = await import("../../src/modules/matching/service");
  let providerId = ""; let providerUserId = ""; let buyerId = ""; let opportunityId = "";

  beforeAll(async () => {
    const [provider, buyer, opportunity] = await Promise.all([
      db.organization.findUniqueOrThrow({ where: { slug: "sagara-software" }, include: { members: { where: { status: "ACTIVE" }, take: 1 } } }),
      db.organization.findUniqueOrThrow({ where: { slug: "pt-nusantara-logistik" } }),
      db.opportunity.findFirstOrThrow({ where: { slug: "warehouse-management-system" } }),
    ]);
    providerId = provider.id; providerUserId = provider.members[0].userId; buyerId = buyer.id; opportunityId = opportunity.id;
  });

  afterAll(async () => { await db.savedOpportunity.deleteMany({ where: { opportunityId, organizationId: providerId } }); await db.$disconnect(); });

  it("returns the deterministic seed ranking", async () => {
    const matches = await listBuyerOpportunityMatches(buyerId, opportunityId);
    expect(matches.map((item) => item.provider.name)).toEqual(["Sagara Software", "Nusa Systems", "Orbit Teknologi"]);
    expect(matches[0].totalScore).toBeGreaterThan(matches[1].totalScore);
    expect(matches[1].totalScore).toBeGreaterThan(matches[2].totalScore);
  });

  it("orders the provider feed and exposes only provider-safe buyer data", async () => {
    const feed = await listProviderOpportunityFeed(providerId, { sort: "match", limit: 12 });
    expect(feed.items[0].id).toBe(opportunityId);
    const detail = await getProviderOpportunity(providerId, opportunityId, providerUserId);
    const serialized = JSON.stringify(detail);
    expect(serialized).not.toContain("PT Nusantara Logistik");
    expect(serialized).not.toContain("buyerOrganization");
    expect(serialized).not.toContain("decisionMakerInvolved");
    expect(serialized).not.toContain("storageKey");
    expect(serialized).not.toContain("businessEmail");
    expect(serialized).not.toContain("phone");
  });

  it("saves and unsaves idempotently within the provider tenant", async () => {
    expect((await saveOpportunity(providerId, providerUserId, opportunityId)).saved).toBe(true);
    expect((await saveOpportunity(providerId, providerUserId, opportunityId)).saved).toBe(true);
    expect(await db.savedOpportunity.count({ where: { opportunityId, organizationId: providerId } })).toBe(1);
    expect((await unsaveOpportunity(providerId, opportunityId)).saved).toBe(false);
    expect((await unsaveOpportunity(providerId, opportunityId)).saved).toBe(false);
  });

  it("enforces buyer ownership on match access", async () => {
    await expect(listBuyerOpportunityMatches(providerId, opportunityId)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
