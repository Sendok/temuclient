import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AIProvider } from "../../src/modules/ai/provider";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("Phase 8 contextual AI Sales", async () => {
  const { db } = await import("../../src/server/db/client");
  const { redis, redisKey } = await import("../../src/server/redis/client");
  const { enforceAIRateLimit } = await import("../../src/server/auth/rate-limit");
  const {
    generateDealHealth,
    generateDiscoveryAnalysis,
    generateFollowUpDraft,
    generateMatchExplanation,
    generateMeetingPrep,
    generateOpportunitySummary,
    generateProposalOutline,
  } = await import("../../src/modules/ai/sales-service");

  let providerId = "";
  let providerUserId = "";
  let buyerId = "";
  let buyerUserId = "";
  let unrelatedId = "";
  let unrelatedUserId = "";
  let opportunityId = "";
  let introductionId = "";
  let conversationId = "";
  let meetingId = "";
  let dealId = "";

  const actor = () => ({ userId: providerUserId, organizationId: providerId, role: "OWNER" as const });

  beforeAll(async () => {
    const [provider, buyer, unrelated] = await Promise.all([
      db.organization.findUniqueOrThrow({ where: { slug: "sagara-software" }, include: { members: { where: { status: "ACTIVE" }, take: 1, include: { user: true } } } }),
      db.organization.findUniqueOrThrow({ where: { slug: "pt-nusantara-logistik" }, include: { members: { where: { status: "ACTIVE" }, take: 1, include: { user: true } } } }),
      db.organization.findUniqueOrThrow({ where: { slug: "nusa-systems" }, include: { members: { where: { status: "ACTIVE" }, take: 1, include: { user: true } } } }),
    ]);
    providerId = provider.id;
    providerUserId = provider.members[0].userId;
    buyerId = buyer.id;
    buyerUserId = buyer.members[0].userId;
    unrelatedId = unrelated.id;
    unrelatedUserId = providerUserId;

    const opportunity = await db.opportunity.create({
      data: {
        buyerOrganizationId: buyerId,
        title: "Phase 8 AI Warehouse Integration",
        slug: `phase-8-ai-${Date.now()}`,
        problemStatement: "Operasi warehouse masih manual dan sulit dipantau lintas lokasi.",
        businessObjective: "Meningkatkan akurasi inventory dan kecepatan fulfillment.",
        budgetMin: BigInt(250_000_000),
        budgetMax: BigInt(400_000_000),
        currency: "IDR",
        timelineEnd: new Date("2027-01-31T00:00:00.000Z"),
        decisionMakerInvolved: true,
        intentScore: 91,
        intentLevel: "VERY_HIGH",
        status: "ACTIVE",
        createdById: buyerUserId,
        requirements: {
          create: [
            { category: "BUSINESS", label: "Inventory multi-warehouse", description: "Visibilitas stok lima warehouse.", priority: "MUST_HAVE", sortOrder: 0 },
            { category: "INTEGRATION", label: "ERP integration", description: "Sinkronisasi dengan ERP existing.", priority: "MUST_HAVE", sortOrder: 1 },
          ],
        },
      },
    });
    opportunityId = opportunity.id;
    await db.opportunityMatch.create({
      data: {
        opportunityId,
        providerOrganizationId: providerId,
        totalScore: 88,
        serviceScore: 25,
        industryScore: 12,
        budgetScore: 15,
        portfolioScore: 12,
        technologyScore: 8,
        capacityScore: 8,
        locationScore: 4,
        availabilityScore: 4,
        explanationJson: [],
        algorithmVersion: "deterministic-v1",
        calculatedAt: new Date(),
      },
    });
    const introduction = await db.introduction.create({
      data: {
        opportunityId,
        buyerOrganizationId: buyerId,
        providerOrganizationId: providerId,
        requestedById: providerUserId,
        acceptedById: buyerUserId,
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });
    introductionId = introduction.id;
    const deal = await db.deal.create({
      data: {
        opportunityId,
        buyerOrganizationId: buyerId,
        providerOrganizationId: providerId,
        ownerUserId: providerUserId,
        title: opportunity.title,
        stage: "DISCOVERY",
        estimatedValue: BigInt(400_000_000),
        expectedCloseDate: new Date("2026-12-31T00:00:00.000Z"),
        probability: 30,
        activities: { create: { userId: providerUserId, type: "MEETING", title: "Discovery completed", occurredAt: new Date() } },
      },
    });
    dealId = deal.id;
    const conversation = await db.conversation.create({
      data: {
        opportunityId,
        introductionId,
        dealId,
        participants: {
          create: [
            { userId: providerUserId, organizationId: providerId },
            { userId: buyerUserId, organizationId: buyerId },
          ],
        },
      },
    });
    conversationId = conversation.id;
    const meeting = await db.meeting.create({
      data: {
        opportunityId,
        introductionId,
        dealId,
        title: "Phase 8 Discovery",
        startsAt: new Date("2026-08-20T03:00:00.000Z"),
        endsAt: new Date("2026-08-20T04:00:00.000Z"),
        status: "COMPLETED",
        createdById: providerUserId,
        participants: {
          create: [
            { userId: providerUserId, email: provider.members[0].user.email, name: provider.members[0].user.name, role: "Provider" },
            { userId: buyerUserId, email: buyer.members[0].user.email, name: buyer.members[0].user.name, role: "Buyer" },
          ],
        },
      },
    });
    meetingId = meeting.id;
  });

  afterAll(async () => {
    const entityIds = [opportunityId, meetingId, conversationId, dealId].filter(Boolean);
    await db.aIExecution.deleteMany({ where: { entityId: { in: entityIds } } });
    if (meetingId) await db.meeting.deleteMany({ where: { id: meetingId } });
    if (conversationId) await db.conversation.deleteMany({ where: { id: conversationId } });
    if (dealId) await db.deal.deleteMany({ where: { id: dealId } });
    if (introductionId) await db.introduction.deleteMany({ where: { id: introductionId } });
    if (opportunityId) await db.opportunity.deleteMany({ where: { id: opportunityId } });
    const rateKey = redisKey("rate-limit", "ai", "FREE", providerId, providerUserId, "integration_rate");
    if (redis.status === "wait") await redis.connect();
    await redis.del(rateKey);
    await db.$disconnect();
    redis.disconnect();
  });

  it("summarizes Provider-safe Opportunity context and preserves deterministic Match Score", async () => {
    const summary = await generateOpportunitySummary(actor(), opportunityId);
    expect(summary.conciseProblem).toContain("warehouse");
    expect(summary.scope.length).toBeGreaterThan(0);
    const explanation = await generateMatchExplanation(actor(), opportunityId);
    expect(explanation.score).toBe(88);
    expect(explanation.summary).toContain("88");
    expect(explanation.assistance.mode).toBe("fallback");
  });

  it("generates structured Meeting Prep and logs AIExecution without raw prompt", async () => {
    const prep = await generateMeetingPrep(actor(), meetingId);
    expect(prep.recommendedDiscoveryQuestions.length).toBeGreaterThan(2);
    expect(prep.stakeholders.length).toBe(2);
    const execution = await db.aIExecution.findFirstOrThrow({
      where: { feature: "meeting_prep", entityId: meetingId, userId: providerUserId },
      orderBy: { createdAt: "desc" },
    });
    expect(execution.status).toBe("SUCCESS");
    expect(execution.entityType).toBe("Meeting");
    expect(Object.keys(execution)).not.toContain("prompt");
  });

  it("analyzes discovery, drafts follow-up, and never creates a Message", async () => {
    const notes = "Proses stok masih manual. CTO menyetujui prioritas. Budget Rp 350 juta dan target tiga bulan. Risiko utama adalah integrasi ERP.";
    const discovery = await generateDiscoveryAnalysis(actor(), meetingId, notes);
    expect(discovery.painPoints.length).toBeGreaterThan(0);
    expect(discovery.nextBestAction).toBeTruthy();
    const before = await db.message.count({ where: { conversationId } });
    const draft = await generateFollowUpDraft(actor(), conversationId, notes, "PROFESSIONAL");
    expect(draft.requiresReview).toBe(true);
    expect(await db.message.count({ where: { conversationId } })).toBe(before);
  });

  it("creates only an editable Proposal outline and contextual Deal Health", async () => {
    const proposalsBefore = await db.proposal.count({ where: { dealId } });
    const outline = await generateProposalOutline(actor(), dealId, "Gunakan delivery bertahap.");
    expect(outline.requiresReview).toBe(true);
    expect(await db.proposal.count({ where: { dealId } })).toBe(proposalsBefore);
    const health = await generateDealHealth(actor(), dealId);
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(health.confidence).not.toBe("CERTAIN");
  });

  it("rejects unrelated entity access before provider execution", async () => {
    await expect(generateMeetingPrep({ userId: unrelatedUserId, organizationId: unrelatedId, role: "OWNER" }, meetingId)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await db.aIExecution.count({ where: { userId: unrelatedUserId, organizationId: unrelatedId, entityId: meetingId } })).toBe(0);
  });

  it("logs provider failure and returns a recoverable error", async () => {
    const unavailable: AIProvider = {
      name: "test-provider",
      model: "test-model",
      mode: "provider",
      generateText: async () => { throw new Error("provider offline"); },
      generateObject: async () => { throw new Error("provider offline"); },
    };
    await expect(generateDealHealth(actor(), dealId, unavailable)).rejects.toMatchObject({ code: "AI_PROVIDER_UNAVAILABLE", status: 503 });
    expect(await db.aIExecution.count({ where: { entityId: dealId, feature: "deal_health", status: "FAILED" } })).toBe(1);
  });

  it("enforces a per-user, per-organization, per-feature plan limit", async () => {
    const key = redisKey("rate-limit", "ai", "FREE", providerId, providerUserId, "integration_rate");
    if (redis.status === "wait") await redis.connect();
    await redis.del(key);
    for (let index = 0; index < 10; index += 1)
      await enforceAIRateLimit({ userId: providerUserId, organizationId: providerId, feature: "integration_rate", plan: "FREE" });
    await expect(enforceAIRateLimit({ userId: providerUserId, organizationId: providerId, feature: "integration_rate", plan: "FREE" })).rejects.toMatchObject({ code: "AI_RATE_LIMITED", status: 429 });
    await redis.del(key);
  });
});
