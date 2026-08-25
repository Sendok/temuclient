import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)(
  "Introduction transaction, isolation, events, and privacy",
  async () => {
    const { db } = await import("../../src/server/db/client");
    const {
      acceptIntroduction,
      cancelIntroduction,
      declineIntroduction,
      getIntroduction,
      requestIntroduction,
    } = await import("../../src/modules/introductions/service");
    let providerId = "";
    let providerUserId = "";
    let buyerId = "";
    let buyerUserId = "";
    let opportunityId = "";
    let portfolioId = "";
    let unrelatedOrganizationId = "";
    const requestInput = {
      portfolioIds: [] as string[],
      fitSummary:
        "Kami memiliki pengalaman langsung membangun platform warehouse multi-lokasi dan integrasi operasional.",
      proposedApproach:
        "Kami memulai dengan discovery terstruktur, menjalankan pilot satu warehouse, lalu rollout bertahap dengan pengukuran.",
      estimatedTimeline: "4–6 bulan",
      message: "Kami siap membahas konteks delivery bersama tim Buyer.",
    };

    beforeAll(async () => {
      const [provider, buyer, opportunity, unrelated] = await Promise.all([
        db.organization.findUniqueOrThrow({
          where: { slug: "sagara-software" },
          include: {
            members: { where: { status: "ACTIVE" }, take: 1 },
            portfolios: { where: { status: "PUBLISHED" }, take: 1 },
          },
        }),
        db.organization.findUniqueOrThrow({
          where: { slug: "pt-nusantara-logistik" },
          include: { members: { where: { status: "ACTIVE" }, take: 1 } },
        }),
        db.opportunity.findFirstOrThrow({
          where: { slug: "warehouse-management-system" },
        }),
        db.organization.findUniqueOrThrow({ where: { slug: "nusa-systems" } }),
      ]);
      providerId = provider.id;
      providerUserId = provider.members[0].userId;
      portfolioId = provider.portfolios[0].id;
      buyerId = buyer.id;
      buyerUserId = buyer.members[0].userId;
      opportunityId = opportunity.id;
      unrelatedOrganizationId = unrelated.id;
      requestInput.portfolioIds = [portfolioId];
    });

    afterEach(cleanup);
    afterAll(async () => {
      await cleanup();
      await db.$disconnect();
    });

    it("creates a Provider request, audit event, and Buyer notification", async () => {
      const introduction = await requestIntroduction(
        providerId,
        providerUserId,
        opportunityId,
        requestInput,
      );
      expect(introduction.status).toBe("REQUESTED");
      expect(introduction.portfolios[0].id).toBe(portfolioId);
      expect(
        await db.auditLog.count({
          where: {
            entityType: "Introduction",
            entityId: introduction.id,
            action: "INTRODUCTION_REQUESTED",
          },
        }),
      ).toBe(1);
      expect(
        await db.notification.count({
          where: {
            entityType: "Introduction",
            entityId: introduction.id,
            type: "INTRODUCTION_REQUESTED",
          },
        }),
      ).toBeGreaterThan(0);
    });

    it("blocks concurrent active duplicates at service and database level", async () => {
      const results = await Promise.allSettled([
        requestIntroduction(
          providerId,
          providerUserId,
          opportunityId,
          requestInput,
        ),
        requestIntroduction(
          providerId,
          providerUserId,
          opportunityId,
          requestInput,
        ),
      ]);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      const rejected = results.find((result) => result.status === "rejected");
      expect(rejected).toMatchObject({
        reason: { code: "INTRODUCTION_ALREADY_EXISTS" },
      });
      expect(
        await db.introduction.count({
          where: {
            opportunityId,
            providerOrganizationId: providerId,
            status: { in: ["REQUESTED", "ACCEPTED"] },
          },
        }),
      ).toBe(1);
    });

    it("accepts transactionally, creates participants, unlocks context, and is idempotent", async () => {
      const requested = await requestIntroduction(
        providerId,
        providerUserId,
        opportunityId,
        requestInput,
      );
      const accepted = await acceptIntroduction(
        buyerId,
        buyerUserId,
        requested.id,
      );
      expect(accepted.status).toBe("ACCEPTED");
      expect(accepted.connectionContext?.conversationId).toBeTruthy();
      expect(accepted.connectionContext?.organization.name).toBe(
        "Sagara Software",
      );
      const providerView = await getIntroduction(providerId, requested.id);
      expect(providerView.connectionContext?.organization.name).toBe(
        "PT Nusantara Logistik",
      );
      expect(providerView.connectionContext?.contacts[0].email).toBe(
        "buyer@temuclient.local",
      );
      const conversationId = accepted.connectionContext?.conversationId ?? "";
      expect(
        await db.conversationParticipant.count({ where: { conversationId } }),
      ).toBe(2);
      await acceptIntroduction(buyerId, buyerUserId, requested.id);
      expect(
        await db.conversation.count({
          where: { introductionId: requested.id },
        }),
      ).toBe(1);
      expect(
        await db.notification.count({
          where: { entityId: requested.id, type: "INTRODUCTION_ACCEPTED" },
        }),
      ).toBe(1);
    });

    it("rolls back acceptance when event handling fails", async () => {
      const requested = await requestIntroduction(
        providerId,
        providerUserId,
        opportunityId,
        requestInput,
      );
      await expect(
        acceptIntroduction(buyerId, buyerUserId, requested.id, {
          publish: async () => {
            throw new Error("simulated publisher failure");
          },
        }),
      ).rejects.toThrow("simulated publisher failure");
      expect(
        (
          await db.introduction.findUniqueOrThrow({
            where: { id: requested.id },
          })
        ).status,
      ).toBe("REQUESTED");
      expect(
        await db.conversation.count({
          where: { introductionId: requested.id },
        }),
      ).toBe(0);
      expect(
        await db.auditLog.count({
          where: { entityId: requested.id, action: "INTRODUCTION_ACCEPTED" },
        }),
      ).toBe(0);
    });

    it("declines without exposing internal Buyer reason to Provider", async () => {
      const requested = await requestIntroduction(
        providerId,
        providerUserId,
        opportunityId,
        requestInput,
      );
      await declineIntroduction(
        buyerId,
        buyerUserId,
        requested.id,
        "Internal procurement preference",
      );
      const providerView = await getIntroduction(providerId, requested.id);
      expect(providerView.status).toBe("DECLINED");
      expect(JSON.stringify(providerView)).not.toContain(
        "Internal procurement preference",
      );
    });

    it("allows Provider cancellation and isolates unrelated organizations", async () => {
      const requested = await requestIntroduction(
        providerId,
        providerUserId,
        opportunityId,
        requestInput,
      );
      await expect(
        getIntroduction(unrelatedOrganizationId, requested.id),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(
        (await cancelIntroduction(providerId, providerUserId, requested.id))
          .status,
      ).toBe("CANCELLED");
      await expect(
        cancelIntroduction(providerId, providerUserId, requested.id),
      ).rejects.toMatchObject({ code: "INTRODUCTION_INVALID_STATE" });
    });

    it("keeps Buyer identity and direct contact private before acceptance", async () => {
      const requested = await requestIntroduction(
        providerId,
        providerUserId,
        opportunityId,
        requestInput,
      );
      const providerView = await getIntroduction(providerId, requested.id);
      const serialized = JSON.stringify(providerView);
      expect(providerView.connectionContext).toBeNull();
      expect(serialized).not.toContain("PT Nusantara Logistik");
      expect(serialized).not.toContain("buyer@temuclient.local");
      expect(serialized).not.toContain("businessEmail");
      expect(serialized).not.toContain("phone");
    });

    async function cleanup() {
      if (!opportunityId) return;
      const introductions = await db.introduction.findMany({
        where: { opportunityId, providerOrganizationId: providerId },
        select: { id: true, conversation: { select: { id: true } } },
      });
      const introductionIds = introductions.map((item) => item.id);
      const conversationIds = introductions.flatMap((item) =>
        item.conversation ? [item.conversation.id] : [],
      );
      if (conversationIds.length)
        await db.conversation.deleteMany({
          where: { id: { in: conversationIds } },
        });
      await db.deal.deleteMany({
        where: { opportunityId, providerOrganizationId: providerId },
      });
      if (introductionIds.length) {
        await db.notification.deleteMany({
          where: {
            entityType: "Introduction",
            entityId: { in: introductionIds },
          },
        });
        await db.auditLog.deleteMany({
          where: {
            entityType: "Introduction",
            entityId: { in: introductionIds },
          },
        });
        await db.introduction.deleteMany({
          where: { id: { in: introductionIds } },
        });
      }
    }
  },
);
