import type { OrganizationRole, Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import {
  databaseDealEventPublisher,
  type DealEventPublisher,
} from "@/modules/deals/events";
import { canManageDeal, canReadDeal } from "@/modules/deals/permissions";
import type {
  CreateProposalInput,
  UpdateProposalInput,
} from "@/modules/proposals/schema";
import { db } from "@/server/db/client";
import {
  canTransitionProposalStatus,
  nextProposalVersion,
} from "@/modules/proposals/versioning";

const proposalInclude = {
  createdBy: { select: { id: true, name: true } },
  deal: {
    select: {
      id: true,
      title: true,
      status: true,
      stage: true,
      providerOrganizationId: true,
      buyerOrganizationId: true,
      ownerUserId: true,
      opportunity: { select: { id: true, title: true } },
      buyerOrganization: { select: { id: true, name: true } },
    },
  },
} as const;

type ProposalRecord = Prisma.ProposalGetPayload<{ include: typeof proposalInclude }>;

export async function listProposals(organizationId: string, dealId: string) {
  const deal = await db.deal.findUnique({ where: { id: dealId } });
  assertDealRead(deal, organizationId);
  const rows = await db.proposal.findMany({
    where: { dealId },
    include: proposalInclude,
    orderBy: { version: "desc" },
  });
  return rows.map(toProposalDto);
}

export async function getProposal(organizationId: string, id: string) {
  const proposal = await db.proposal.findUnique({ where: { id }, include: proposalInclude });
  assertProposalRead(proposal, organizationId);
  return toProposalDto(proposal!);
}

export async function createProposal(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  dealId: string,
  input: CreateProposalInput,
) {
  return db.$transaction(async (transaction) => {
    await lockDeal(transaction, dealId);
    const deal = await transaction.deal.findUnique({ where: { id: dealId } });
    assertProposalManage(deal, organizationId, userId, role);
    if (deal!.status !== "OPEN")
      throw new DomainError("DEAL_INVALID_STATE", "Deal yang ditutup tidak dapat memiliki Proposal baru.", 409);
    if (deal!.stage === "INTRODUCTION")
      throw new DomainError(
        "DEAL_INVALID_STATE",
        "Selesaikan tahap Introduction sebelum membuat Proposal.",
        409,
      );
    const draft = await transaction.proposal.findFirst({
      where: { dealId, status: "DRAFT" },
      select: { id: true },
    });
    if (draft)
      throw new DomainError("PROPOSAL_DRAFT_EXISTS", "Selesaikan draft Proposal yang aktif terlebih dahulu.", 409);
    const latest = await transaction.proposal.aggregate({
      where: { dealId },
      _max: { version: true },
    });
    const proposal = await transaction.proposal.create({
      data: {
        dealId,
        version: nextProposalVersion(latest._max.version),
        title: input.title,
        summary: input.summary ?? null,
        amount: input.amount ?? null,
        currency: input.currency,
        documentUrl: input.documentUrl ?? null,
        createdById: userId,
      },
      include: proposalInclude,
    });
    await transaction.dealActivity.create({
      data: {
        dealId,
        userId,
        type: "PROPOSAL",
        title: `Proposal v${proposal.version} dibuat`,
        occurredAt: new Date(),
        metadataJson: { proposalId: proposal.id, version: proposal.version },
      },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: "PROPOSAL_CREATED",
        entityType: "Proposal",
        entityId: proposal.id,
        afterJson: { dealId, version: proposal.version, status: proposal.status },
      },
    });
    return toProposalDto(proposal);
  });
}

export async function updateProposal(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  id: string,
  input: UpdateProposalInput,
) {
  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM "Proposal" WHERE id = ${id} FOR UPDATE`;
    const proposal = await transaction.proposal.findUnique({ where: { id }, include: proposalInclude });
    assertProposalManage(proposal?.deal ?? null, organizationId, userId, role);
    const fieldEdit = [input.title, input.summary, input.amount, input.currency, input.documentUrl].some(
      (value) => value !== undefined,
    );
    if (fieldEdit && proposal!.status !== "DRAFT")
      throw new DomainError("PROPOSAL_INVALID_STATE", "Hanya draft Proposal yang dapat diedit.", 409);
    if (input.status) assertProposalStatusTransition(proposal!.status, input.status);
    const now = new Date();
    const updated = await transaction.proposal.update({
      where: { id },
      data: {
        title: input.title,
        summary: input.summary,
        amount: input.amount,
        currency: input.currency,
        documentUrl: input.documentUrl,
        status: input.status,
        acceptedAt: input.status === "ACCEPTED" ? now : undefined,
        rejectedAt: input.status === "REJECTED" ? now : undefined,
      },
      include: proposalInclude,
    });
    if (input.status)
      await transaction.dealActivity.create({
        data: {
          dealId: proposal!.dealId,
          userId,
          type: "PROPOSAL",
          title: `Proposal v${proposal!.version} ${input.status.toLowerCase()}`,
          occurredAt: now,
          metadataJson: { proposalId: id, status: input.status },
        },
      });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: input.status ? `PROPOSAL_${input.status}` : "PROPOSAL_UPDATED",
        entityType: "Proposal",
        entityId: id,
        beforeJson: { status: proposal!.status, version: proposal!.version },
        afterJson: { status: updated.status, version: updated.version },
      },
    });
    return toProposalDto(updated);
  });
}

export async function submitProposal(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  id: string,
  publisher: DealEventPublisher = databaseDealEventPublisher,
) {
  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM "Proposal" WHERE id = ${id} FOR UPDATE`;
    const proposal = await transaction.proposal.findUnique({ where: { id }, include: proposalInclude });
    assertProposalManage(proposal?.deal ?? null, organizationId, userId, role);
    if (proposal!.status === "SUBMITTED") return toProposalDto(proposal!);
    if (proposal!.status !== "DRAFT")
      throw new DomainError("PROPOSAL_INVALID_STATE", "Proposal ini tidak dapat disubmit.", 409);
    const submittedAt = new Date();
    const updated = await transaction.proposal.update({
      where: { id },
      data: { status: "SUBMITTED", submittedAt },
      include: proposalInclude,
    });
    await transaction.dealActivity.create({
      data: {
        dealId: proposal!.dealId,
        userId,
        type: "PROPOSAL",
        title: `Proposal v${proposal!.version} disubmit`,
        occurredAt: submittedAt,
        metadataJson: { proposalId: id, version: proposal!.version },
      },
    });
    const recipients = await buyerRecipients(transaction, proposal!.deal.buyerOrganizationId);
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: "PROPOSAL_SUBMITTED",
        entityType: "Proposal",
        entityId: id,
        beforeJson: { status: proposal!.status },
        afterJson: { status: "SUBMITTED", submittedAt: submittedAt.toISOString() },
        metadataJson: {
          domainEvent: "ProposalSubmitted",
          analyticsEvent: "proposal_submitted",
          dealId: proposal!.dealId,
        },
      },
    });
    await publisher.publish(transaction, {
      name: "ProposalSubmitted",
      dealId: proposal!.dealId,
      dealTitle: proposal!.deal.title,
      recipientUserIds: recipients,
    });
    return toProposalDto(updated);
  });
}

function assertProposalStatusTransition(from: string, to: string) {
  if (!canTransitionProposalStatus(from, to))
    throw new DomainError(
      "PROPOSAL_INVALID_STATE",
      `Proposal tidak dapat berubah dari ${from} ke ${to}.`,
      409,
    );
}

function assertDealRead(
  deal: { providerOrganizationId: string } | null,
  organizationId: string,
) {
  if (!deal || !canReadDeal(deal.providerOrganizationId, organizationId))
    throw new DomainError("NOT_FOUND", "Deal tidak ditemukan.", 404);
}

function assertProposalRead(proposal: ProposalRecord | null, organizationId: string) {
  if (!proposal || !canReadDeal(proposal.deal.providerOrganizationId, organizationId))
    throw new DomainError("NOT_FOUND", "Proposal tidak ditemukan.", 404);
}

function assertProposalManage(
  deal: { providerOrganizationId: string; ownerUserId: string } | null,
  organizationId: string,
  userId: string,
  role: OrganizationRole,
) {
  assertDealRead(deal, organizationId);
  if (!canManageDeal(role, userId, deal!.ownerUserId))
    throw new DomainError("FORBIDDEN", "Anda tidak memiliki izin mengelola Proposal ini.", 403);
}

async function buyerRecipients(transaction: Prisma.TransactionClient, organizationId: string) {
  const members = await transaction.organizationMember.findMany({
    where: { organizationId, status: "ACTIVE", role: { in: ["OWNER", "ADMIN"] } },
    select: { userId: true },
  });
  return members.map((item) => item.userId);
}

async function lockDeal(transaction: Prisma.TransactionClient, id: string) {
  await transaction.$queryRaw`SELECT id FROM "Deal" WHERE id = ${id} FOR UPDATE`;
}

function toProposalDto(proposal: ProposalRecord) {
  return {
    id: proposal.id,
    dealId: proposal.dealId,
    version: proposal.version,
    title: proposal.title,
    summary: proposal.summary,
    amount: proposal.amount?.toString() ?? null,
    currency: proposal.currency,
    status: proposal.status,
    documentUrl: proposal.documentUrl,
    submittedAt: proposal.submittedAt?.toISOString() ?? null,
    acceptedAt: proposal.acceptedAt?.toISOString() ?? null,
    rejectedAt: proposal.rejectedAt?.toISOString() ?? null,
    createdBy: proposal.createdBy,
    deal: proposal.deal,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  };
}

export type ProposalData = Awaited<ReturnType<typeof getProposal>>;
export type ProposalListData = Awaited<ReturnType<typeof listProposals>>;
