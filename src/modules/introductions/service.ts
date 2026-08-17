import type { OrganizationType, Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import {
  databaseIntroductionEventPublisher,
  type IntroductionEventPublisher,
} from "@/modules/introductions/events";
import type {
  IntroductionListQuery,
  RequestIntroductionInput,
} from "@/modules/introductions/schema";
import { assertIntroductionTransition } from "@/modules/introductions/state-machine";
import { db } from "@/server/db/client";
import { initializeDealForAcceptedIntroduction } from "@/modules/deals/service";

const activeStatuses = ["REQUESTED", "ACCEPTED"] as const;
const introductionInclude = {
  opportunity: {
    select: {
      id: true,
      title: true,
      status: true,
      industry: { select: { name: true } },
      serviceCategory: { select: { name: true } },
      matches: {
        select: {
          providerOrganizationId: true,
          totalScore: true,
          serviceScore: true,
          industryScore: true,
          budgetScore: true,
          portfolioScore: true,
          technologyScore: true,
          capacityScore: true,
          locationScore: true,
          availabilityScore: true,
          explanationJson: true,
          algorithmVersion: true,
        },
      },
    },
  },
  buyerOrganization: { select: { id: true, name: true } },
  providerOrganization: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      website: true,
      description: true,
      country: true,
      province: true,
      city: true,
      companySize: true,
      teamCapacity: true,
      availability: true,
      services: {
        include: {
          serviceCategory: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { isPrimary: "desc" as const },
      },
      industries: {
        include: { industry: { select: { id: true, name: true, slug: true } } },
      },
      verifications: { select: { type: true, status: true } },
    },
  },
  requestedBy: { select: { id: true, name: true } },
  acceptedBy: { select: { id: true, name: true } },
  portfolios: {
    include: {
      portfolio: {
        include: {
          industry: { select: { name: true } },
          technologies: {
            include: { technology: { select: { id: true, name: true } } },
          },
        },
      },
    },
  },
  conversation: { select: { id: true, dealId: true } },
} as const;

type IntroductionRecord = Prisma.IntroductionGetPayload<{
  include: typeof introductionInclude;
}>;

export async function requestIntroduction(
  providerOrganizationId: string,
  userId: string,
  opportunityId: string,
  input: RequestIntroductionInput,
  publisher: IntroductionEventPublisher = databaseIntroductionEventPublisher,
) {
  const match = await db.opportunityMatch.findFirst({
    where: { providerOrganizationId, opportunityId },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          buyerOrganizationId: true,
          status: true,
          expiresAt: true,
        },
      },
      providerOrganization: { select: { id: true, name: true, status: true } },
    },
  });
  if (
    !match ||
    !["ACTIVE", "MATCHING"].includes(match.opportunity.status) ||
    (match.opportunity.expiresAt && match.opportunity.expiresAt <= new Date())
  )
    throw new DomainError(
      "INTRODUCTION_NOT_ELIGIBLE",
      "Opportunity tidak tersedia untuk Introduction.",
      409,
    );
  if (match.providerOrganization.status !== "ACTIVE")
    throw new DomainError(
      "ORGANIZATION_SUSPENDED",
      "Organisasi Provider tidak aktif.",
      403,
    );
  const portfolios = await db.portfolio.findMany({
    where: {
      id: { in: input.portfolioIds },
      organizationId: providerOrganizationId,
      status: "PUBLISHED",
    },
    select: { id: true },
  });
  if (portfolios.length !== input.portfolioIds.length)
    throw new DomainError(
      "VALIDATION_ERROR",
      "Salah satu portfolio tidak valid atau belum dipublish.",
      400,
      { portfolioIds: "Pilih portfolio terpublikasi milik organisasi Anda." },
    );
  if (
    await db.introduction.findFirst({
      where: {
        opportunityId,
        providerOrganizationId,
        status: { in: [...activeStatuses] },
      },
      select: { id: true },
    })
  )
    throw new DomainError(
      "INTRODUCTION_ALREADY_EXISTS",
      "Introduction aktif untuk opportunity ini sudah ada.",
      409,
    );
  try {
    const created = await db.$transaction(async (transaction) => {
      const introduction = await transaction.introduction.create({
        data: {
          opportunityId,
          buyerOrganizationId: match.opportunity.buyerOrganizationId,
          providerOrganizationId,
          requestedById: userId,
          fitSummary: input.fitSummary,
          proposedApproach: input.proposedApproach,
          estimatedTimeline: input.estimatedTimeline,
          message: input.message,
          expiresAt: new Date(Date.now() + 14 * 86_400_000),
          portfolios: {
            create: input.portfolioIds.map((portfolioId) => ({ portfolioId })),
          },
        },
      });
      const recipients = await transaction.organizationMember.findMany({
        where: {
          organizationId: match.opportunity.buyerOrganizationId,
          status: "ACTIVE",
          role: { in: ["OWNER", "ADMIN"] },
        },
        select: { userId: true },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: userId,
          actorOrganizationId: providerOrganizationId,
          action: "INTRODUCTION_REQUESTED",
          entityType: "Introduction",
          entityId: introduction.id,
          afterJson: { status: "REQUESTED", opportunityId },
          metadataJson: { domainEvent: "IntroductionRequested" },
        },
      });
      await publisher.publish(transaction, {
        name: "IntroductionRequested",
        introductionId: introduction.id,
        opportunityTitle: match.opportunity.title,
        providerName: match.providerOrganization.name,
        recipientUserIds: recipients.map((item) => item.userId),
      });
      return introduction;
    });
    return getIntroduction(providerOrganizationId, created.id);
  } catch (error) {
    if (isUniqueConstraintError(error))
      throw new DomainError(
        "INTRODUCTION_ALREADY_EXISTS",
        "Introduction aktif untuk opportunity ini sudah ada.",
        409,
      );
    throw error;
  }
}

export async function listIntroductions(
  organizationId: string,
  organizationType: OrganizationType,
  query: IntroductionListQuery,
) {
  const direction =
    query.direction ?? (organizationType === "BUYER" ? "incoming" : "outgoing");
  const relationship =
    organizationType === "HYBRID" && !query.direction
      ? {
          OR: [
            { buyerOrganizationId: organizationId },
            { providerOrganizationId: organizationId },
          ],
        }
      : direction === "incoming"
        ? { buyerOrganizationId: organizationId }
        : { providerOrganizationId: organizationId };
  const rows = await db.introduction.findMany({
    where: {
      ...relationship,
      status: query.status,
      opportunityId: query.opportunity,
    },
    include: introductionInclude,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => toIntroductionDto(row, organizationId));
}

export async function getIntroduction(organizationId: string, id: string) {
  const row = await db.introduction.findFirst({
    where: {
      id,
      OR: [
        { buyerOrganizationId: organizationId },
        { providerOrganizationId: organizationId },
      ],
    },
    include: introductionInclude,
  });
  if (!row)
    throw new DomainError("NOT_FOUND", "Introduction tidak ditemukan.", 404);
  const connectionContext =
    row.status === "ACCEPTED"
      ? await loadConnectionContext(row, organizationId)
      : null;
  return { ...toIntroductionDto(row, organizationId), connectionContext };
}

export async function acceptIntroduction(
  buyerOrganizationId: string,
  userId: string,
  id: string,
  publisher: IntroductionEventPublisher = databaseIntroductionEventPublisher,
) {
  await db.$transaction(async (transaction) => {
    await lockIntroduction(transaction, id);
    const introduction = await transaction.introduction.findUnique({
      where: { id },
      include: {
        opportunity: { select: { title: true, budgetMax: true, currency: true } },
        providerOrganization: { select: { name: true } },
      },
    });
    if (
      !introduction ||
      introduction.buyerOrganizationId !== buyerOrganizationId
    )
      throw new DomainError("NOT_FOUND", "Introduction tidak ditemukan.", 404);
    if (introduction.status === "ACCEPTED") {
      await initializeDealForAcceptedIntroduction(transaction, introduction, userId);
      return;
    }
    if (introduction.expiresAt && introduction.expiresAt <= new Date())
      throw new DomainError(
        "INTRODUCTION_EXPIRED",
        "Introduction telah kedaluwarsa.",
        409,
      );
    assertIntroductionTransition(introduction.status, "ACCEPTED");
    const acceptedAt = new Date();
    await transaction.introduction.update({
      where: { id },
      data: { status: "ACCEPTED", acceptedById: userId, acceptedAt },
    });
    const conversation = await transaction.conversation.create({
      data: { opportunityId: introduction.opportunityId, introductionId: id },
    });
    const participants = [
      {
        conversationId: conversation.id,
        userId: introduction.requestedById,
        organizationId: introduction.providerOrganizationId,
      },
      {
        conversationId: conversation.id,
        userId,
        organizationId: buyerOrganizationId,
      },
    ].filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.userId === item.userId) ===
        index,
    );
    await transaction.conversationParticipant.createMany({
      data: participants,
    });
    const deal = await initializeDealForAcceptedIntroduction(
      transaction,
      introduction,
      userId,
    );
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: buyerOrganizationId,
        action: "INTRODUCTION_ACCEPTED",
        entityType: "Introduction",
        entityId: id,
        beforeJson: { status: introduction.status },
        afterJson: {
          status: "ACCEPTED",
          acceptedAt: acceptedAt.toISOString(),
          conversationId: conversation.id,
          dealId: deal.id,
        },
        metadataJson: { domainEvent: "IntroductionAccepted" },
      },
    });
    await publisher.publish(transaction, {
      name: "IntroductionAccepted",
      introductionId: id,
      opportunityTitle: introduction.opportunity.title,
      providerName: introduction.providerOrganization.name,
      recipientUserIds: [introduction.requestedById],
    });
  });
  return getIntroduction(buyerOrganizationId, id);
}

export async function declineIntroduction(
  buyerOrganizationId: string,
  userId: string,
  id: string,
  reason: string | undefined,
  publisher: IntroductionEventPublisher = databaseIntroductionEventPublisher,
) {
  await db.$transaction(async (transaction) => {
    await lockIntroduction(transaction, id);
    const introduction = await transaction.introduction.findUnique({
      where: { id },
      include: {
        opportunity: { select: { title: true } },
        providerOrganization: { select: { name: true } },
      },
    });
    if (
      !introduction ||
      introduction.buyerOrganizationId !== buyerOrganizationId
    )
      throw new DomainError("NOT_FOUND", "Introduction tidak ditemukan.", 404);
    assertIntroductionTransition(introduction.status, "DECLINED");
    const declinedAt = new Date();
    await transaction.introduction.update({
      where: { id },
      data: { status: "DECLINED", declinedAt, declineReason: reason },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: buyerOrganizationId,
        action: "INTRODUCTION_DECLINED",
        entityType: "Introduction",
        entityId: id,
        beforeJson: { status: introduction.status },
        afterJson: { status: "DECLINED", declinedAt: declinedAt.toISOString() },
        metadataJson: {
          domainEvent: "IntroductionDeclined",
          hasInternalReason: Boolean(reason),
        },
      },
    });
    await publisher.publish(transaction, {
      name: "IntroductionDeclined",
      introductionId: id,
      opportunityTitle: introduction.opportunity.title,
      providerName: introduction.providerOrganization.name,
      recipientUserIds: [introduction.requestedById],
    });
  });
  return getIntroduction(buyerOrganizationId, id);
}

export async function cancelIntroduction(
  providerOrganizationId: string,
  userId: string,
  id: string,
  publisher: IntroductionEventPublisher = databaseIntroductionEventPublisher,
) {
  await db.$transaction(async (transaction) => {
    await lockIntroduction(transaction, id);
    const introduction = await transaction.introduction.findUnique({
      where: { id },
      include: {
        opportunity: { select: { title: true } },
        providerOrganization: { select: { name: true } },
      },
    });
    if (
      !introduction ||
      introduction.providerOrganizationId !== providerOrganizationId
    )
      throw new DomainError("NOT_FOUND", "Introduction tidak ditemukan.", 404);
    assertIntroductionTransition(introduction.status, "CANCELLED");
    const cancelledAt = new Date();
    await transaction.introduction.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt },
    });
    const recipients = await transaction.organizationMember.findMany({
      where: {
        organizationId: introduction.buyerOrganizationId,
        status: "ACTIVE",
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: { userId: true },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: providerOrganizationId,
        action: "INTRODUCTION_CANCELLED",
        entityType: "Introduction",
        entityId: id,
        beforeJson: { status: introduction.status },
        afterJson: {
          status: "CANCELLED",
          cancelledAt: cancelledAt.toISOString(),
        },
        metadataJson: { domainEvent: "IntroductionCancelled" },
      },
    });
    await publisher.publish(transaction, {
      name: "IntroductionCancelled",
      introductionId: id,
      opportunityTitle: introduction.opportunity.title,
      providerName: introduction.providerOrganization.name,
      recipientUserIds: recipients.map((item) => item.userId),
    });
  });
  return getIntroduction(providerOrganizationId, id);
}

async function lockIntroduction(
  transaction: Prisma.TransactionClient,
  id: string,
) {
  await transaction.$queryRaw`SELECT id FROM "Introduction" WHERE id = ${id} FOR UPDATE`;
}

async function loadConnectionContext(
  row: IntroductionRecord,
  viewerOrganizationId: string,
) {
  const isProvider = row.providerOrganizationId === viewerOrganizationId;
  const [buyer, provider, participants, attachments] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: row.buyerOrganizationId },
      select: {
        id: true,
        name: true,
        businessEmail: true,
        phone: true,
        city: true,
      },
    }),
    db.organization.findUniqueOrThrow({
      where: { id: row.providerOrganizationId },
      select: {
        id: true,
        name: true,
        businessEmail: true,
        phone: true,
        city: true,
      },
    }),
    row.conversation
      ? db.conversationParticipant.findMany({
          where: { conversationId: row.conversation.id },
          select: {
            organizationId: true,
            user: { select: { id: true, name: true, email: true } },
          },
        })
      : [],
    isProvider
      ? db.opportunityAttachment.findMany({
          where: {
            opportunityId: row.opportunityId,
            visibility: { in: ["PUBLIC_SUMMARY", "INTRODUCED_PROVIDER"] },
          },
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            visibility: true,
            createdAt: true,
          },
        })
      : [],
  ]);
  const counterpart = isProvider ? buyer : provider;
  return {
    conversationId: row.conversation?.id ?? null,
    dealId: row.conversation?.dealId ?? null,
    organization: counterpart,
    contacts: participants
      .filter((item) => item.organizationId === counterpart.id)
      .map((item) => item.user),
    attachments: attachments.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

function toIntroductionDto(
  row: IntroductionRecord,
  viewerOrganizationId: string,
) {
  const isProvider = row.providerOrganizationId === viewerOrganizationId;
  const match = row.opportunity.matches.find(
    (item) => item.providerOrganizationId === row.providerOrganizationId,
  );
  return {
    id: row.id,
    opportunity: {
      id: row.opportunity.id,
      title: row.opportunity.title,
      status: row.opportunity.status,
      serviceName: row.opportunity.serviceCategory?.name ?? null,
      industryName: row.opportunity.industry?.name ?? null,
    },
    status: row.status,
    direction: isProvider ? ("outgoing" as const) : ("incoming" as const),
    safeBuyerDisplay:
      row.status === "ACCEPTED"
        ? row.buyerOrganization.name
        : `Verified ${row.opportunity.industry?.name ?? "Buyer"} Company`,
    provider: {
      id: row.providerOrganization.id,
      name: row.providerOrganization.name,
      slug: row.providerOrganization.slug,
      logoUrl: row.providerOrganization.logoUrl,
      website: row.providerOrganization.website,
      description: row.providerOrganization.description,
      country: row.providerOrganization.country,
      province: row.providerOrganization.province,
      city: row.providerOrganization.city,
      companySize: row.providerOrganization.companySize,
      teamCapacity: row.providerOrganization.teamCapacity,
      availability: row.providerOrganization.availability,
      services: row.providerOrganization.services.map((item) => ({
        id: item.id,
        name: item.serviceCategory.name,
        slug: item.serviceCategory.slug,
        isPrimary: item.isPrimary,
      })),
      industries: row.providerOrganization.industries.map((item) => ({
        id: item.industry.id,
        name: item.industry.name,
        slug: item.industry.slug,
        experienceLevel: item.experienceLevel,
      })),
      verificationSummary: row.providerOrganization.verifications,
    },
    match: match
      ? {
          totalScore: match.totalScore,
          factors: {
            service: match.serviceScore,
            industry: match.industryScore,
            budget: match.budgetScore,
            portfolio: match.portfolioScore,
            technology: match.technologyScore,
            capacity: match.capacityScore,
            location: match.locationScore,
            availability: match.availabilityScore,
          },
          reasons: match.explanationJson,
          algorithmVersion: match.algorithmVersion,
        }
      : null,
    portfolios: row.portfolios.map(({ portfolio }) => ({
      id: portfolio.id,
      title: portfolio.title,
      clientDisplayName: portfolio.isClientConfidential
        ? `Confidential ${portfolio.industry?.name ?? "Client"} Company`
        : (portfolio.clientName ?? "Client tidak ditampilkan"),
      industryName: portfolio.industry?.name ?? null,
      problem: portfolio.problem,
      solution: portfolio.solution,
      outcome: portfolio.outcome,
      technologies: portfolio.technologies.map(({ technology }) => technology),
    })),
    fitSummary: row.fitSummary,
    proposedApproach: row.proposedApproach,
    estimatedTimeline: row.estimatedTimeline,
    message: row.message,
    declineReason: isProvider ? undefined : row.declineReason,
    requestedBy: { id: row.requestedBy.id, name: row.requestedBy.name },
    acceptedBy: row.acceptedBy,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    declinedAt: row.declinedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    conversationId:
      row.status === "ACCEPTED" ? (row.conversation?.id ?? null) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export type IntroductionData = Awaited<ReturnType<typeof getIntroduction>>;
export type IntroductionListData = Awaited<
  ReturnType<typeof listIntroductions>
>;
