import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("subscription entitlement enforcement", async () => {
  const { db } = await import("../../src/server/db/client");
  const { assertTeamSeatAvailable, consumeOpportunityAccess, getEffectiveEntitlements } = await import("../../src/modules/entitlements/access");
  const { getOrganizationAnalytics } = await import("../../src/modules/analytics/service");
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let freeOrganizationId = "";
  let proOrganizationId = "";
  let ownerId = "";

  beforeAll(async () => {
    const owner = await db.user.create({ data: { name: "Entitlement Owner", email: `entitlement-${nonce}@example.test` } });
    ownerId = owner.id;
    const free = await db.organization.create({ data: { name: "Free Entitlement Provider", slug: `free-entitlement-${nonce}`, type: "PROVIDER", members: { create: { userId: owner.id, role: "OWNER", status: "ACTIVE" } }, subscription: { create: { plan: "FREE", status: "ACTIVE", provider: "sandbox" } } } });
    const pro = await db.organization.create({ data: { name: "Pro Entitlement Provider", slug: `pro-entitlement-${nonce}`, type: "PROVIDER", subscription: { create: { plan: "PRO", status: "ACTIVE", provider: "sandbox", periodEnd: new Date(Date.now() + 86_400_000) } } } });
    freeOrganizationId = free.id;
    proOrganizationId = pro.id;
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: [freeOrganizationId, proOrganizationId] } } });
    await db.user.deleteMany({ where: { OR: [{ id: ownerId }, { email: { startsWith: `seat-${nonce}` } }] } });
    await db.$disconnect();
  });

  it("resolves active plans and enforces the FREE opportunity quota", async () => {
    expect(await getEffectiveEntitlements(proOrganizationId)).toMatchObject({ plan: "PRO", entitlements: { matchIntelligence: true, aiSalesAssistant: true } });
    for (let index = 0; index < 10; index += 1) await consumeOpportunityAccess(freeOrganizationId, `opportunity-${index}`);
    await expect(consumeOpportunityAccess(freeOrganizationId, "opportunity-over-limit")).rejects.toMatchObject({ code: "OPPORTUNITY_ACCESS_LIMIT_REACHED", status: 403 });
    await expect(consumeOpportunityAccess(freeOrganizationId, "opportunity-0")).resolves.toMatchObject({ limit: 10 });
  });

  it("enforces team seats from the effective plan", async () => {
    await expect(assertTeamSeatAvailable(freeOrganizationId)).resolves.toMatchObject({ plan: "FREE" });
    const second = await db.user.create({ data: { name: "Second Seat", email: `seat-${nonce}@example.test` } });
    await db.organizationMember.create({ data: { organizationId: freeOrganizationId, userId: second.id, role: "MEMBER", status: "INVITED" } });
    await expect(assertTeamSeatAvailable(freeOrganizationId)).rejects.toMatchObject({ code: "TEAM_SEAT_LIMIT_REACHED", status: 409 });
  });

  it("gates advanced analytics and isolates data by organization", async () => {
    await expect(getOrganizationAnalytics(freeOrganizationId, new Date(0), new Date(Date.now() + 60_000))).rejects.toMatchObject({ code: "PLAN_UPGRADE_REQUIRED", status: 403 });
    await db.analyticsEvent.createMany({ data: [
      { name: "introduction_accepted", organizationId: freeOrganizationId },
      { name: "introduction_accepted", organizationId: proOrganizationId },
      { name: "opportunity_viewed", organizationId: proOrganizationId },
    ] });
    await expect(getOrganizationAnalytics(proOrganizationId, new Date(0), new Date(Date.now() + 60_000))).resolves.toMatchObject({ qualifiedIntroductions: 1, opportunity_viewed: 1 });
  });
});
