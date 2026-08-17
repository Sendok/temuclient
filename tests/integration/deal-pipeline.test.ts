import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DealEventPublisher } from "../../src/modules/deals/events";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("Phase 7 Deal pipeline transactions and isolation", async () => {
  const { db } = await import("../../src/server/db/client");
  const { acceptIntroduction } = await import("../../src/modules/introductions/service");
  const {
    addDealActivity,
    changeDealStage,
    getDeal,
    markDealLost,
    markDealWon,
    updateDeal,
  } = await import("../../src/modules/deals/service");
  const {
    createProposal,
    getProposal,
    submitProposal,
    updateProposal,
  } = await import("../../src/modules/proposals/service");

  let providerId = "";
  let providerUserId = "";
  let buyerId = "";
  let buyerUserId = "";
  let unrelatedId = "";
  let salesUserId = "";
  const opportunityIds: string[] = [];
  const introductionIds: string[] = [];
  const dealIds: string[] = [];

  beforeAll(async () => {
    const [provider, buyer, unrelated] = await Promise.all([
      db.organization.findUniqueOrThrow({ where: { slug: "sagara-software" }, include: { members: { where: { status: "ACTIVE" }, take: 1 } } }),
      db.organization.findUniqueOrThrow({ where: { slug: "pt-nusantara-logistik" }, include: { members: { where: { status: "ACTIVE" }, take: 1 } } }),
      db.organization.findUniqueOrThrow({ where: { slug: "nusa-systems" } }),
    ]);
    providerId = provider.id;
    providerUserId = provider.members[0].userId;
    buyerId = buyer.id;
    buyerUserId = buyer.members[0].userId;
    unrelatedId = unrelated.id;
    const sales = await db.user.create({
      data: { name: "Phase 7 Sales", email: `phase7-sales-${Date.now()}@test.local` },
    });
    salesUserId = sales.id;
    await db.organizationMember.create({
      data: { organizationId: providerId, userId: salesUserId, role: "SALES" },
    });
  });

  afterAll(async () => {
    if (dealIds.length) {
      await db.auditLog.deleteMany({
        where: { entityType: "Deal", entityId: { in: dealIds } },
      });
      const activities = await db.dealActivity.findMany({ where: { dealId: { in: dealIds } }, select: { id: true } });
      const proposals = await db.proposal.findMany({ where: { dealId: { in: dealIds } }, select: { id: true } });
      await db.auditLog.deleteMany({ where: { entityType: "DealActivity", entityId: { in: activities.map((item) => item.id) } } });
      await db.auditLog.deleteMany({ where: { entityType: "Proposal", entityId: { in: proposals.map((item) => item.id) } } });
      await db.notification.deleteMany({ where: { entityType: "Deal", entityId: { in: dealIds } } });
    }
    if (introductionIds.length) {
      await db.notification.deleteMany({ where: { entityType: "Introduction", entityId: { in: introductionIds } } });
      await db.auditLog.deleteMany({ where: { entityType: "Introduction", entityId: { in: introductionIds } } });
    }
    if (dealIds.length) await db.deal.deleteMany({ where: { id: { in: dealIds } } });
    if (introductionIds.length) {
      await db.conversation.deleteMany({ where: { introductionId: { in: introductionIds } } });
      await db.introduction.deleteMany({ where: { id: { in: introductionIds } } });
    }
    if (opportunityIds.length) await db.opportunity.deleteMany({ where: { id: { in: opportunityIds } } });
    if (salesUserId) {
      await db.organizationMember.deleteMany({ where: { userId: salesUserId } });
      await db.user.deleteMany({ where: { id: salesUserId } });
    }
    await db.$disconnect();
  });

  async function acceptedDeal(label: string) {
    const opportunity = await db.opportunity.create({
      data: {
        buyerOrganizationId: buyerId,
        title: `Phase 7 ${label}`,
        slug: `phase-7-${label.toLowerCase()}-${Date.now()}-${opportunityIds.length}`,
        problemStatement: "Kebutuhan komersial terverifikasi untuk integration test Deal Pipeline.",
        budgetMax: BigInt(450_000_000),
        currency: "IDR",
        status: "ACTIVE",
        createdById: buyerUserId,
      },
    });
    opportunityIds.push(opportunity.id);
    const introduction = await db.introduction.create({
      data: {
        opportunityId: opportunity.id,
        buyerOrganizationId: buyerId,
        providerOrganizationId: providerId,
        requestedById: providerUserId,
        status: "REQUESTED",
      },
    });
    introductionIds.push(introduction.id);
    const accepted = await acceptIntroduction(buyerId, buyerUserId, introduction.id);
    const dealId = accepted.connectionContext?.dealId ?? "";
    dealIds.push(dealId);
    return getDeal(providerId, dealId);
  }

  it("creates Deal, history, activity, and context atomically on acceptance", async () => {
    const deal = await acceptedDeal("Won Flow");
    expect(deal.stage).toBe("INTRODUCTION");
    expect(deal.status).toBe("OPEN");
    expect(deal.estimatedValue).toBe("450000000");
    expect(deal.stageHistory).toHaveLength(1);
    expect(deal.stageHistory[0].fromStage).toBeNull();
    expect(deal.activities.some((item) => item.type === "SYSTEM")).toBe(true);
    expect(deal.conversationId).toBeTruthy();
    expect((await db.conversation.findFirstOrThrow({ where: { dealId: deal.id } })).dealId).toBe(deal.id);
  });

  it("enforces tenant and assigned Sales isolation while keeping managers authorized", async () => {
    const deal = await getDeal(providerId, dealIds[0]);
    await expect(getDeal(unrelatedId, deal.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await updateDeal(providerId, providerUserId, "OWNER", deal.id, { ownerUserId: salesUserId });
    await expect(updateDeal(providerId, providerUserId, "SALES", deal.id, { probability: 25 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await updateDeal(providerId, salesUserId, "SALES", deal.id, { probability: 25 })).probability).toBe(25);
    expect((await updateDeal(providerId, providerUserId, "OWNER", deal.id, { ownerUserId: providerUserId })).owner.id).toBe(providerUserId);
  });

  it("persists notes privately and progresses with immutable stage history and analytics events", async () => {
    const dealId = dealIds[0];
    await addDealActivity(providerId, providerUserId, "OWNER", dealId, {
      type: "NOTE",
      title: "Discovery internal",
      description: "Internal pricing boundary—not shared with Buyer.",
    });
    const events: string[] = [];
    const publisher: DealEventPublisher = {
      publish: async (_transaction, event) => {
        events.push(event.name);
      },
    };
    await changeDealStage(providerId, providerUserId, "OWNER", dealId, "DISCOVERY", publisher);
    await expect(changeDealStage(providerId, providerUserId, "OWNER", dealId, "NEGOTIATION")).rejects.toMatchObject({ code: "DEAL_INVALID_STATE" });
    const discovery = await getDeal(providerId, dealId);
    expect(discovery.stageHistory.map((item) => item.toStage)).toEqual(["DISCOVERY", "INTRODUCTION"]);
    expect(events).toEqual(["DealStageChanged"]);
    expect(JSON.stringify(discovery.activities)).toContain("Internal pricing boundary");
    await expect(getDeal(buyerId, dealId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await db.auditLog.count({ where: { entityType: "Deal", entityId: dealId, action: "DEAL_STAGE_CHANGED" } })).toBe(1);
  });

  it("versions, edits, submits, and records Proposal activity and Buyer notification", async () => {
    const dealId = dealIds[0];
    const proposal = await createProposal(providerId, providerUserId, "OWNER", dealId, {
      title: "Implementation Proposal",
      summary: "Delivery bertahap untuk warehouse platform.",
      amount: BigInt(425_000_000),
      currency: "IDR",
      documentUrl: "https://files.example/proposal-v1.pdf",
    });
    expect(proposal.version).toBe(1);
    await expect(createProposal(providerId, providerUserId, "OWNER", dealId, {
      title: "Duplicate draft",
      currency: "IDR",
    })).rejects.toMatchObject({ code: "PROPOSAL_DRAFT_EXISTS" });
    expect((await updateProposal(providerId, providerUserId, "OWNER", proposal.id, { summary: "Revised delivery summary." })).summary).toContain("Revised");
    expect((await submitProposal(providerId, providerUserId, "OWNER", proposal.id)).status).toBe("SUBMITTED");
    expect((await submitProposal(providerId, providerUserId, "OWNER", proposal.id)).status).toBe("SUBMITTED");
    await expect(updateProposal(providerId, providerUserId, "OWNER", proposal.id, { title: "Illegal edit" })).rejects.toMatchObject({ code: "PROPOSAL_INVALID_STATE" });
    expect((await getProposal(providerId, proposal.id)).amount).toBe("425000000");
    expect(await db.notification.count({ where: { entityType: "Deal", entityId: dealId, type: "PROPOSAL" } })).toBe(1);
  });

  it("moves Proposal to Negotiation, marks Won transactionally, and keeps closure final", async () => {
    const dealId = dealIds[0];
    await changeDealStage(providerId, providerUserId, "OWNER", dealId, "PROPOSAL");
    await changeDealStage(providerId, providerUserId, "OWNER", dealId, "NEGOTIATION");
    const won = await markDealWon(providerId, providerUserId, "OWNER", dealId, BigInt(440_000_000));
    expect(won.stage).toBe("WON");
    expect(won.status).toBe("WON");
    expect(won.estimatedValue).toBe("440000000");
    expect(won.wonAt).toBeTruthy();
    expect(won.stageHistory.map((item) => item.toStage)).toContain("WON");
    await expect(markDealLost(providerId, providerUserId, "OWNER", dealId, "Too late")).rejects.toMatchObject({ code: "DEAL_INVALID_STATE" });
  });

  it("requires a reason for Lost and makes Lost final", async () => {
    const deal = await acceptedDeal("Lost Flow");
    const lost = await markDealLost(providerId, providerUserId, "OWNER", deal.id, "Budget approval was withdrawn");
    expect(lost.stage).toBe("LOST");
    expect(lost.status).toBe("LOST");
    expect(lost.lostReason).toBe("Budget approval was withdrawn");
    expect(lost.lostAt).toBeTruthy();
    await expect(changeDealStage(providerId, providerUserId, "OWNER", deal.id, "DISCOVERY")).rejects.toMatchObject({ code: "DEAL_INVALID_STATE" });
  });
});
