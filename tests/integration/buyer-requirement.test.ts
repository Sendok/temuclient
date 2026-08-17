import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("Buyer Requirement lifecycle, privacy, and isolation", async () => {
  const { db } = await import("../../src/server/db/client");
  const { register } = await import("../../src/modules/auth/service");
  const { createOrganizationWithOwner } = await import("../../src/modules/organizations/service");
  const { addAttachmentMetadata, cancelOpportunity, createOpportunityDraft, extendOpportunity, getBuyerOpportunity, pauseOpportunity, publishOpportunity, updateOpportunityDraft } = await import("../../src/modules/opportunities/service");
  const { listBuyerOpportunityMatches } = await import("../../src/modules/matching/service");
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const userIds: string[] = []; const organizationIds: string[] = []; const opportunityIds: string[] = [];
  let organizationA = ""; let organizationB = ""; let userA = ""; let categoryId = ""; let industryId = "";

  beforeAll(async () => {
    const [registeredA, registeredB] = await Promise.all([register({ name: "Buyer A", email: `buyer-a-${nonce}@example.test`, password: "ValidPass123" }), register({ name: "Buyer B", email: `buyer-b-${nonce}@example.test`, password: "ValidPass123" })]);
    userA = registeredA.user.id; userIds.push(userA, registeredB.user.id);
    const [orgA, orgB] = await Promise.all([createOrganizationWithOwner(userA, registeredA.session.session.id, { name: `Buyer A ${nonce}`, type: "BUYER", city: "Jakarta", description: "Buyer organization for Opportunity integration lifecycle tests.", businessEmail: `business-a-${nonce}@example.test` }), createOrganizationWithOwner(registeredB.user.id, registeredB.session.session.id, { name: `Buyer B ${nonce}`, type: "BUYER", city: "Bandung", description: "Second Buyer organization for tenant isolation coverage." })]);
    organizationA = orgA.organization.id; organizationB = orgB.organization.id; organizationIds.push(organizationA, organizationB);
    const [category, industry] = await Promise.all([db.serviceCategory.findFirstOrThrow({ where: { organizations: { some: {} } } }), db.industry.findFirstOrThrow()]); categoryId = category.id; industryId = industry.id;
  });

  afterAll(async () => { if (opportunityIds.length) { await db.opportunity.deleteMany({ where: { id: { in: opportunityIds } } }); await db.auditLog.deleteMany({ where: { entityType: "Opportunity", entityId: { in: opportunityIds } } }); } if (organizationIds.length) await db.organization.deleteMany({ where: { id: { in: organizationIds } } }); if (userIds.length) await db.user.deleteMany({ where: { id: { in: userIds } } }); await db.$disconnect(); });

  it("creates, edits, publishes, pauses, extends, and cancels a persisted Opportunity", async () => {
    const draft = await createOpportunityDraft(organizationA, userA, { initialDescription: "We need an integrated inventory platform across several warehouse locations.", currency: "IDR", country: "Indonesia", remoteAllowed: true, decisionMakerInvolved: false }); opportunityIds.push(draft.id); expect(draft.status).toBe("DRAFT");
    const reviewed = await updateOpportunityDraft(organizationA, userA, draft.id, { title: "Integrated Warehouse Platform", serviceCategoryId: categoryId, industryId, problemStatement: "Inventory visibility is fragmented across several warehouse locations and systems.", businessObjective: "Improve stock accuracy and operational visibility.", projectType: "NEW_DEVELOPMENT", budgetMin: BigInt(200_000_000), budgetMax: BigInt(400_000_000), budgetStatus: "APPROVED", timelineStart: new Date("2026-08-20T00:00:00Z"), timelineEnd: new Date("2027-01-31T00:00:00Z"), country: "Indonesia", city: "Jakarta", decisionMakerInvolved: true, markForReview: true, requirements: [{ category: "FUNCTIONAL", label: "Multi-location inventory", description: "Manage inventory across all warehouse locations.", priority: "MUST_HAVE", sortOrder: 0 }] }); expect(reviewed.status).toBe("REVIEW");
    const attachment = await addAttachmentMetadata(organizationA, userA, draft.id, { name: "requirements.pdf", mimeType: "application/pdf", size: 120_000, visibility: "BUYER_ONLY" }); expect(JSON.stringify(attachment)).not.toContain("storageKey");
    const published = await publishOpportunity(organizationA, userA, draft.id, true); expect(published.status).toBe("ACTIVE"); expect(published.intentScore).toBeGreaterThanOrEqual(80); expect(JSON.stringify(await getBuyerOpportunity(organizationA, draft.id))).not.toContain("pending/"); expect((await listBuyerOpportunityMatches(organizationA, draft.id)).length).toBeGreaterThan(0);
    await expect(getBuyerOpportunity(organizationB, draft.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(updateOpportunityDraft(organizationB, userA, draft.id, { title: "Cross tenant edit" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await pauseOpportunity(organizationA, userA, draft.id)).status).toBe("PAUSED");
    expect((await extendOpportunity(organizationA, userA, draft.id, 30)).status).toBe("PAUSED");
    expect((await cancelOpportunity(organizationA, userA, draft.id)).status).toBe("CANCELLED");
    await expect(publishOpportunity(organizationA, userA, draft.id, true)).rejects.toMatchObject({ code: "OPPORTUNITY_INVALID_STATE" });
  });

  it("rejects incomplete publish attempts", async () => { const draft = await createOpportunityDraft(organizationA, userA, { initialDescription: "A business problem that is detailed enough to create a draft safely.", currency: "IDR", country: "Indonesia", remoteAllowed: true, decisionMakerInvolved: false }); opportunityIds.push(draft.id); await expect(publishOpportunity(organizationA, userA, draft.id, true)).rejects.toMatchObject({ code: "OPPORTUNITY_INCOMPLETE" }); });
});
