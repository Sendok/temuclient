import type { OrganizationRole, Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import {
  databaseDealEventPublisher,
  type DealEventPublisher,
} from "@/modules/deals/events";
import { canCreateDeal, canManageDeal, canReadDeal } from "@/modules/deals/permissions";
import type {
  CreateDealActivityInput,
  CreateDealInput,
  DealListQuery,
  UpdateDealInput,
} from "@/modules/deals/schema";
import {
  assertDealAdvance,
  canMarkDealLost,
  canMarkDealWon,
  stageProbability,
} from "@/modules/deals/state-machine";
import { db } from "@/server/db/client";

const dealInclude = {
  opportunity: {
    select: {
      id: true,
      title: true,
      status: true,
      problemStatement: true,
      budgetMin: true,
      budgetMax: true,
      currency: true,
    },
  },
  buyerOrganization: { select: { id: true, name: true, city: true } },
  providerOrganization: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, email: true } },
  activities: {
    orderBy: [{ occurredAt: "desc" as const }, { id: "desc" as const }],
    take: 20,
    include: { user: { select: { id: true, name: true } } },
  },
  stageHistory: {
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    include: { changedBy: { select: { id: true, name: true } } },
  },
  proposals: {
    orderBy: { version: "desc" as const },
    select: {
      id: true,
      version: true,
      title: true,
      amount: true,
      currency: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
    },
  },
  conversations: {
    select: {
      id: true,
      participants: {
        select: {
          organizationId: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    take: 1,
  },
  meetings: {
    orderBy: { startsAt: "desc" as const },
    take: 10,
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      status: true,
    },
  },
} satisfies Prisma.DealInclude;

type DealRecord = Prisma.DealGetPayload<{ include: typeof dealInclude }>;

type AcceptedIntroductionForDeal = {
  id: string;
  opportunityId: string;
  buyerOrganizationId: string;
  providerOrganizationId: string;
  requestedById: string;
  opportunity: {
    title: string;
    budgetMax: bigint | null;
    currency: string;
  };
};

export async function initializeDealForAcceptedIntroduction(
  transaction: Prisma.TransactionClient,
  introduction: AcceptedIntroductionForDeal,
  changedById: string,
) {
  const key = {
    opportunityId_providerOrganizationId: {
      opportunityId: introduction.opportunityId,
      providerOrganizationId: introduction.providerOrganizationId,
    },
  };
  const existing = await transaction.deal.findUnique({ where: key });
  if (existing) {
    await attachDealContext(transaction, introduction.id, introduction.opportunityId, existing.id);
    return existing;
  }
  const deal = await transaction.deal.create({
    data: {
      opportunityId: introduction.opportunityId,
      buyerOrganizationId: introduction.buyerOrganizationId,
      providerOrganizationId: introduction.providerOrganizationId,
      ownerUserId: introduction.requestedById,
      title: introduction.opportunity.title,
      estimatedValue: introduction.opportunity.budgetMax,
      currency: introduction.opportunity.currency,
      probability: stageProbability("INTRODUCTION"),
      stageHistory: {
        create: {
          fromStage: null,
          toStage: "INTRODUCTION",
          changedById,
        },
      },
      activities: {
        create: {
          userId: introduction.requestedById,
          type: "SYSTEM",
          title: "Deal dibuat dari Introduction yang diterima",
          occurredAt: new Date(),
          metadataJson: { introductionId: introduction.id },
        },
      },
    },
  });
  await attachDealContext(transaction, introduction.id, introduction.opportunityId, deal.id);
  return deal;
}

export async function listDeals(
  organizationId: string,
  query: DealListQuery,
) {
  const rows = await db.deal.findMany({
    where: {
      providerOrganizationId: organizationId,
      stage: query.stage,
      status:
        query.status ??
        (query.view === "closed" ? { in: ["WON", "LOST"] } : undefined),
      ownerUserId: query.owner,
      expectedCloseDate: {
        gte: query.expectedCloseFrom
          ? new Date(`${query.expectedCloseFrom}T00:00:00.000Z`)
          : undefined,
        lte: query.expectedCloseTo
          ? new Date(`${query.expectedCloseTo}T23:59:59.999Z`)
          : undefined,
      },
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: "insensitive" as const } },
              {
                opportunity: {
                  title: { contains: query.q, mode: "insensitive" as const },
                },
              },
              {
                buyerOrganization: {
                  name: { contains: query.q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    },
    include: dealInclude,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toDealDto);
}

export async function getDeal(organizationId: string, id: string) {
  const deal = await db.deal.findUnique({ where: { id }, include: dealInclude });
  assertDealRead(deal, organizationId);
  return toDealDto(deal!);
}

export async function createDeal(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  input: CreateDealInput,
) {
  if (!canCreateDeal(role))
    throw new DomainError("FORBIDDEN", "Role Anda tidak dapat membuat Deal.", 403);
  return db.$transaction(async (transaction) => {
    const introduction = await transaction.introduction.findFirst({
      where: {
        opportunityId: input.opportunityId,
        providerOrganizationId: organizationId,
        status: "ACCEPTED",
      },
      include: {
        opportunity: {
          select: { title: true, budgetMax: true, currency: true },
        },
      },
      orderBy: { acceptedAt: "desc" },
    });
    if (!introduction)
      throw new DomainError(
        "DEAL_RELATIONSHIP_REQUIRED",
        "Deal hanya dapat dibuat dari Introduction yang diterima.",
        403,
      );
    const ownerUserId = input.ownerUserId ?? userId;
    await assertValidOwner(transaction, organizationId, ownerUserId, role, userId);
    const existing = await transaction.deal.findUnique({
      where: {
        opportunityId_providerOrganizationId: {
          opportunityId: input.opportunityId,
          providerOrganizationId: organizationId,
        },
      },
    });
    if (existing)
      throw new DomainError("DEAL_ALREADY_EXISTS", "Deal untuk relasi ini sudah ada.", 409);
    const deal = await transaction.deal.create({
      data: {
        opportunityId: introduction.opportunityId,
        buyerOrganizationId: introduction.buyerOrganizationId,
        providerOrganizationId: introduction.providerOrganizationId,
        ownerUserId,
        title: input.title ?? introduction.opportunity.title,
        estimatedValue: input.estimatedValue ?? introduction.opportunity.budgetMax,
        currency: input.currency,
        probability: input.probability,
        expectedCloseDate: input.expectedCloseDate
          ? new Date(input.expectedCloseDate)
          : null,
        stageHistory: {
          create: { toStage: "INTRODUCTION", changedById: userId },
        },
        activities: {
          create: {
            userId,
            type: "SYSTEM",
            title: "Deal dibuat dari relasi TemuClient",
            occurredAt: new Date(),
          },
        },
      },
    });
    await attachDealContext(transaction, introduction.id, introduction.opportunityId, deal.id);
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: "DEAL_CREATED",
        entityType: "Deal",
        entityId: deal.id,
        afterJson: { stage: deal.stage, status: deal.status },
        metadataJson: { domainEvent: "DealCreated", introductionId: introduction.id },
      },
    });
    return getDealWithinTransaction(transaction, organizationId, deal.id);
  });
}

export async function updateDeal(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  id: string,
  input: UpdateDealInput,
) {
  return db.$transaction(async (transaction) => {
    await lockDeal(transaction, id);
    const deal = await transaction.deal.findUnique({ where: { id } });
    assertDealManage(deal, organizationId, userId, role);
    assertOpen(deal!);
    if (input.ownerUserId)
      await assertValidOwner(transaction, organizationId, input.ownerUserId, role, userId);
    const updated = await transaction.deal.update({
      where: { id },
      data: {
        ownerUserId: input.ownerUserId,
        title: input.title,
        estimatedValue: input.estimatedValue,
        currency: input.currency,
        probability: input.probability,
        expectedCloseDate:
          input.expectedCloseDate === undefined
            ? undefined
            : input.expectedCloseDate
              ? new Date(input.expectedCloseDate)
              : null,
      },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: "DEAL_UPDATED",
        entityType: "Deal",
        entityId: id,
        beforeJson: dealSnapshot(deal!),
        afterJson: dealSnapshot(updated),
      },
    });
    return getDealWithinTransaction(transaction, organizationId, id);
  });
}

export async function changeDealStage(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  id: string,
  toStage: "DISCOVERY" | "PROPOSAL" | "NEGOTIATION",
  publisher: DealEventPublisher = databaseDealEventPublisher,
) {
  return db.$transaction(async (transaction) => {
    await lockDeal(transaction, id);
    const deal = await transaction.deal.findUnique({ where: { id } });
    assertDealManage(deal, organizationId, userId, role);
    assertOpen(deal!);
    assertDealAdvance(deal!.stage, toStage);
    const updated = await transaction.deal.update({
      where: { id },
      data: { stage: toStage, probability: stageProbability(toStage) },
    });
    await transaction.dealStageHistory.create({
      data: { dealId: id, fromStage: deal!.stage, toStage, changedById: userId },
    });
    await transaction.dealActivity.create({
      data: {
        dealId: id,
        userId,
        type: "STAGE_CHANGE",
        title: `Stage berubah ke ${toStage}`,
        occurredAt: new Date(),
        metadataJson: { fromStage: deal!.stage, toStage },
      },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: "DEAL_STAGE_CHANGED",
        entityType: "Deal",
        entityId: id,
        beforeJson: { stage: deal!.stage },
        afterJson: { stage: toStage },
        metadataJson: {
          domainEvent: "DealStageChanged",
          analyticsEvent: "deal_stage_changed",
        },
      },
    });
    await publisher.publish(transaction, {
      name: "DealStageChanged",
      dealId: id,
      dealTitle: updated.title,
      recipientUserIds: [],
    });
    return getDealWithinTransaction(transaction, organizationId, id);
  });
}

export async function markDealWon(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  id: string,
  finalValue: bigint | null | undefined,
  publisher: DealEventPublisher = databaseDealEventPublisher,
) {
  return closeDeal(
    organizationId,
    userId,
    role,
    id,
    "WON",
    finalValue,
    undefined,
    publisher,
  );
}

export async function markDealLost(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  id: string,
  reason: string,
  publisher: DealEventPublisher = databaseDealEventPublisher,
) {
  return closeDeal(
    organizationId,
    userId,
    role,
    id,
    "LOST",
    undefined,
    reason,
    publisher,
  );
}

export async function listDealActivities(
  organizationId: string,
  id: string,
  type?: "NOTE" | "CALL" | "EMAIL" | "MEETING" | "STAGE_CHANGE" | "PROPOSAL" | "SYSTEM",
) {
  const deal = await db.deal.findUnique({ where: { id } });
  assertDealRead(deal, organizationId);
  const activities = await db.dealActivity.findMany({
    where: { dealId: id, type },
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
  });
  return activities.map(toActivityDto);
}

export async function addDealActivity(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  id: string,
  input: CreateDealActivityInput,
) {
  return db.$transaction(async (transaction) => {
    const deal = await transaction.deal.findUnique({ where: { id } });
    assertDealManage(deal, organizationId, userId, role);
    const activity = await transaction.dealActivity.create({
      data: {
        dealId: id,
        userId,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      },
      include: { user: { select: { id: true, name: true } } },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: "DEAL_ACTIVITY_ADDED",
        entityType: "DealActivity",
        entityId: activity.id,
        metadataJson: { dealId: id, type: input.type },
      },
    });
    return toActivityDto(activity);
  });
}

async function closeDeal(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  id: string,
  outcome: "WON" | "LOST",
  finalValue: bigint | null | undefined,
  reason: string | undefined,
  publisher: DealEventPublisher,
) {
  return db.$transaction(async (transaction) => {
    await lockDeal(transaction, id);
    const deal = await transaction.deal.findUnique({ where: { id } });
    assertDealManage(deal, organizationId, userId, role);
    assertOpen(deal!);
    if (outcome === "WON" && !canMarkDealWon(deal!.stage))
      throw new DomainError(
        "DEAL_INVALID_STATE",
        "Deal hanya dapat dimenangkan setelah Negotiation.",
        409,
      );
    if (outcome === "LOST" && !canMarkDealLost(deal!.stage))
      throw new DomainError("DEAL_INVALID_STATE", "Deal tidak dapat ditandai Lost.", 409);
    const now = new Date();
    const recipients = await buyerRecipients(transaction, deal!.buyerOrganizationId);
    const updated = await transaction.deal.update({
      where: { id },
      data: {
        stage: outcome,
        status: outcome,
        probability: stageProbability(outcome),
        estimatedValue: outcome === "WON" && finalValue != null ? finalValue : undefined,
        wonAt: outcome === "WON" ? now : null,
        lostAt: outcome === "LOST" ? now : null,
        lostReason: outcome === "LOST" ? reason : null,
      },
    });
    await transaction.dealStageHistory.create({
      data: { dealId: id, fromStage: deal!.stage, toStage: outcome, changedById: userId },
    });
    await transaction.dealActivity.create({
      data: {
        dealId: id,
        userId,
        type: "STAGE_CHANGE",
        title: outcome === "WON" ? "Deal ditandai Won" : "Deal ditandai Lost",
        description: outcome === "LOST" ? reason : null,
        occurredAt: now,
        metadataJson: { fromStage: deal!.stage, toStage: outcome },
      },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: `DEAL_${outcome}`,
        entityType: "Deal",
        entityId: id,
        beforeJson: { stage: deal!.stage, status: deal!.status },
        afterJson: {
          stage: outcome,
          status: outcome,
          finalValue: finalValue?.toString(),
          hasLostReason: Boolean(reason),
        },
        metadataJson: {
          domainEvent: outcome === "WON" ? "DealWon" : "DealLost",
          analyticsEvent: outcome === "WON" ? "deal_won" : "deal_lost",
        },
      },
    });
    await publisher.publish(transaction, {
      name: outcome === "WON" ? "DealWon" : "DealLost",
      dealId: id,
      dealTitle: updated.title,
      recipientUserIds: recipients,
    });
    return getDealWithinTransaction(transaction, organizationId, id);
  });
}

async function attachDealContext(
  transaction: Prisma.TransactionClient,
  introductionId: string,
  opportunityId: string,
  dealId: string,
) {
  await Promise.all([
    transaction.conversation.updateMany({
      where: { introductionId },
      data: { dealId },
    }),
    transaction.meeting.updateMany({
      where: { introductionId, opportunityId },
      data: { dealId },
    }),
  ]);
}

async function assertValidOwner(
  transaction: Prisma.TransactionClient,
  organizationId: string,
  ownerUserId: string,
  actorRole: OrganizationRole,
  actorUserId: string,
) {
  if (actorRole === "SALES" && ownerUserId !== actorUserId)
    throw new DomainError("FORBIDDEN", "Sales hanya dapat mengambil Deal miliknya sendiri.", 403);
  const member = await transaction.organizationMember.findFirst({
    where: {
      organizationId,
      userId: ownerUserId,
      status: "ACTIVE",
      role: { in: ["OWNER", "ADMIN", "SALES"] },
    },
  });
  if (!member)
    throw new DomainError("VALIDATION_ERROR", "Deal owner tidak valid.", 400, {
      ownerUserId: "Pilih anggota Provider aktif dengan role Owner, Admin, atau Sales.",
    });
}

function assertDealRead(
  deal: { providerOrganizationId: string } | null,
  organizationId: string,
) {
  if (!deal || !canReadDeal(deal.providerOrganizationId, organizationId))
    throw new DomainError("NOT_FOUND", "Deal tidak ditemukan.", 404);
}

function assertDealManage(
  deal: { providerOrganizationId: string; ownerUserId: string } | null,
  organizationId: string,
  userId: string,
  role: OrganizationRole,
) {
  assertDealRead(deal, organizationId);
  if (!canManageDeal(role, userId, deal!.ownerUserId))
    throw new DomainError("FORBIDDEN", "Anda tidak memiliki izin mengelola Deal ini.", 403);
}

function assertOpen(deal: { status: string }) {
  if (deal.status !== "OPEN")
    throw new DomainError("DEAL_INVALID_STATE", "Deal yang sudah ditutup bersifat final.", 409);
}

async function buyerRecipients(transaction: Prisma.TransactionClient, buyerOrganizationId: string) {
  const members = await transaction.organizationMember.findMany({
    where: {
      organizationId: buyerOrganizationId,
      status: "ACTIVE",
      role: { in: ["OWNER", "ADMIN"] },
    },
    select: { userId: true },
  });
  return members.map((item) => item.userId);
}

async function lockDeal(transaction: Prisma.TransactionClient, id: string) {
  await transaction.$queryRaw`SELECT id FROM "Deal" WHERE id = ${id} FOR UPDATE`;
}

async function getDealWithinTransaction(
  transaction: Prisma.TransactionClient,
  organizationId: string,
  id: string,
) {
  const deal = await transaction.deal.findUnique({ where: { id }, include: dealInclude });
  assertDealRead(deal, organizationId);
  return toDealDto(deal!);
}

function dealSnapshot(deal: {
  ownerUserId: string;
  title: string;
  estimatedValue: bigint | null;
  currency: string;
  probability: number;
  expectedCloseDate: Date | null;
}) {
  return {
    ownerUserId: deal.ownerUserId,
    title: deal.title,
    estimatedValue: deal.estimatedValue?.toString() ?? null,
    currency: deal.currency,
    probability: deal.probability,
    expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null,
  };
}

function toDealDto(deal: DealRecord) {
  const latest = deal.activities[0] ?? null;
  return {
    id: deal.id,
    title: deal.title,
    stage: deal.stage,
    status: deal.status,
    estimatedValue: deal.estimatedValue?.toString() ?? null,
    currency: deal.currency,
    probability: deal.probability,
    expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null,
    wonAt: deal.wonAt?.toISOString() ?? null,
    lostAt: deal.lostAt?.toISOString() ?? null,
    lostReason: deal.lostReason,
    opportunity: {
      ...deal.opportunity,
      budgetMin: deal.opportunity.budgetMin?.toString() ?? null,
      budgetMax: deal.opportunity.budgetMax?.toString() ?? null,
    },
    buyerOrganization: deal.buyerOrganization,
    providerOrganization: deal.providerOrganization,
    owner: deal.owner,
    latestActivity: latest ? toActivityDto(latest) : null,
    nextAction: nextAction(deal.stage),
    activities: deal.activities.map(toActivityDto),
    stageHistory: deal.stageHistory.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    proposals: deal.proposals.map((item) => ({
      ...item,
      amount: item.amount?.toString() ?? null,
      submittedAt: item.submittedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    })),
    conversationId: deal.conversations[0]?.id ?? null,
    stakeholders:
      deal.conversations[0]?.participants
        .filter((item) => item.organizationId === deal.buyerOrganization.id)
        .map((item) => item.user) ?? [],
    meetings: deal.meetings.map((item) => ({
      ...item,
      startsAt: item.startsAt.toISOString(),
      endsAt: item.endsAt.toISOString(),
    })),
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
    health: dealHealth(deal),
  };
}

function toActivityDto(activity: {
  id: string;
  dealId: string;
  type: string;
  title: string;
  description: string | null;
  metadataJson: Prisma.JsonValue | null;
  occurredAt: Date;
  createdAt: Date;
  user: { id: string; name: string };
}) {
  return {
    ...activity,
    occurredAt: activity.occurredAt.toISOString(),
    createdAt: activity.createdAt.toISOString(),
  };
}

function nextAction(stage: string) {
  const actions: Record<string, string> = {
    INTRODUCTION: "Jadwalkan discovery",
    DISCOVERY: "Dokumentasikan kebutuhan dan buat proposal",
    PROPOSAL: "Submit proposal dan lakukan follow-up",
    NEGOTIATION: "Konfirmasi keputusan komersial",
    WON: "Siapkan handoff delivery",
    LOST: "Catat pembelajaran",
  };
  return actions[stage] ?? "Tinjau Deal";
}

function dealHealth(deal: DealRecord) {
  const positives: string[] = [];
  const risks: string[] = [];
  if (deal.estimatedValue != null) positives.push("Estimated value sudah dicatat");
  else risks.push("Estimated value belum ditentukan");
  if (deal.expectedCloseDate) positives.push("Expected close date tersedia");
  else risks.push("Expected close date belum ditentukan");
  if (deal.meetings.some((meeting) => meeting.status === "COMPLETED"))
    positives.push("Discovery meeting telah selesai");
  else risks.push("Belum ada meeting yang selesai");
  if (deal.proposals.some((proposal) => proposal.status !== "DRAFT"))
    positives.push("Proposal sudah disubmit");
  else if (["PROPOSAL", "NEGOTIATION"].includes(deal.stage))
    risks.push("Proposal belum disubmit");
  const score = Math.min(100, Math.max(0, 40 + positives.length * 15 - risks.length * 5));
  return { score, positives, risks };
}

export type DealData = Awaited<ReturnType<typeof getDeal>>;
export type DealListData = Awaited<ReturnType<typeof listDeals>>;
export type DealActivityListData = Awaited<ReturnType<typeof listDealActivities>>;
