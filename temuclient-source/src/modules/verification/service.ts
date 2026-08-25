import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import type { AuditRequestContext } from "@/server/http/request-context";
import type { VerificationRequestInput } from "@/modules/verification/schema";
import { db } from "@/server/db/client";

const verificationInclude = {
  organization: { select: { id: true, name: true, type: true, website: true, businessEmail: true } },
  opportunity: { select: { id: true, title: true, buyerOrganizationId: true } },
  verifiedBy: { select: { id: true, name: true, email: true } },
} as const;

type VerificationRecord = Prisma.VerificationGetPayload<{ include: typeof verificationInclude }>;

export function isValidVerificationDecision(from: string, to: "VERIFIED" | "REJECTED") {
  return from === "PENDING" && (to === "VERIFIED" || to === "REJECTED");
}

export async function listOrganizationVerifications(organizationId: string) {
  const rows = await db.verification.findMany({
    where: { OR: [{ organizationId }, { opportunity: { buyerOrganizationId: organizationId } }] },
    include: verificationInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toVerificationDto);
}

export async function requestVerification(
  organizationId: string,
  userId: string,
  input: VerificationRequestInput,
  requestContext: AuditRequestContext = {},
) {
  if (input.entityType === "ORGANIZATION" && input.entityId !== organizationId) {
    throw new DomainError("FORBIDDEN", "Verifikasi hanya dapat diminta untuk organisasi aktif Anda.", 403);
  }
  if (input.entityType === "OPPORTUNITY") {
    const opportunity = await db.opportunity.findFirst({ where: { id: input.entityId, buyerOrganizationId: organizationId }, select: { id: true } });
    if (!opportunity) throw new DomainError("NOT_FOUND", "Opportunity tidak ditemukan.", 404);
  }
  const where = input.entityType === "ORGANIZATION"
    ? { organizationId: input.entityId, opportunityId: null, type: input.type, status: "PENDING" as const }
    : { opportunityId: input.entityId, type: input.type, status: "PENDING" as const };
  if (await db.verification.findFirst({ where })) {
    throw new DomainError("CONFLICT", "Permintaan verifikasi tipe ini sedang ditinjau.", 409);
  }
  const created = await db.$transaction(async (transaction) => {
    const verification = await transaction.verification.create({
      data: {
        organizationId,
        opportunityId: input.entityType === "OPPORTUNITY" ? input.entityId : null,
        type: input.type,
        evidenceJson: input.evidence,
        notes: input.notes,
      },
      include: verificationInclude,
    });
    await transaction.auditLog.create({ data: {
      actorUserId: userId,
      actorOrganizationId: organizationId,
      action: "VERIFICATION_REQUESTED",
      entityType: "Verification",
      entityId: verification.id,
      afterJson: { type: verification.type, status: verification.status, organizationId: verification.organizationId, opportunityId: verification.opportunityId },
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    } });
    return verification;
  });
  return toVerificationDto(created);
}

export async function decideVerification(
  actorUserId: string,
  id: string,
  status: "VERIFIED" | "REJECTED",
  reason: string | undefined,
  requestContext: AuditRequestContext = {},
) {
  const existing = await db.verification.findUnique({ where: { id }, include: verificationInclude });
  if (!existing) throw new DomainError("NOT_FOUND", "Permintaan verifikasi tidak ditemukan.", 404);
  if (!isValidVerificationDecision(existing.status, status)) {
    throw new DomainError("VERIFICATION_INVALID_STATE", "Hanya verifikasi PENDING yang dapat diputuskan.", 409);
  }
  if (status === "REJECTED" && (!reason || reason.trim().length < 10)) {
    throw new DomainError("VALIDATION_ERROR", "Alasan penolakan minimal 10 karakter.", 400, { reason: "Alasan wajib diisi." });
  }
  const now = new Date();
  const updated = await db.$transaction(async (transaction) => {
    const verification = await transaction.verification.update({
      where: { id },
      data: { status, verifiedById: actorUserId, verifiedAt: status === "VERIFIED" ? now : null, notes: reason ?? existing.notes },
      include: verificationInclude,
    });
    if (verification.opportunityId) {
      const verifiedCount = await transaction.verification.count({ where: { opportunityId: verification.opportunityId, status: "VERIFIED" } });
      await transaction.opportunity.update({ where: { id: verification.opportunityId }, data: { verificationLevel: Math.min(5, verifiedCount) } });
    }
    const organizationId = verification.organizationId ?? verification.opportunity?.buyerOrganizationId;
    await transaction.auditLog.create({ data: {
      actorUserId,
      actorOrganizationId: organizationId,
      action: status === "VERIFIED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
      entityType: "Verification",
      entityId: id,
      beforeJson: { status: existing.status, notes: existing.notes },
      afterJson: { status, notes: verification.notes, verifiedAt: verification.verifiedAt?.toISOString() },
      metadataJson: { verificationType: verification.type },
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    } });
    if (organizationId) {
      const members = await transaction.organizationMember.findMany({ where: { organizationId, status: "ACTIVE" }, select: { userId: true } });
      if (members.length) await transaction.notification.createMany({ data: members.map(({ userId }) => ({
        userId,
        type: "VERIFICATION" as const,
        title: status === "VERIFIED" ? "Verifikasi disetujui" : "Verifikasi ditolak",
        body: status === "VERIFIED" ? `${verification.type} telah diverifikasi oleh tim TemuClient.` : `${verification.type} memerlukan pengajuan ulang. ${reason}`,
        entityType: "Verification",
        entityId: id,
      })) });
    }
    return verification;
  });
  return toVerificationDto(updated);
}

export async function requestVerificationInformation(
  actorUserId: string,
  id: string,
  reason: string,
  requestContext: AuditRequestContext = {},
) {
  const existing = await db.verification.findUnique({ where: { id }, include: verificationInclude });
  if (!existing) throw new DomainError("NOT_FOUND", "Permintaan verifikasi tidak ditemukan.", 404);
  if (existing.status !== "PENDING") throw new DomainError("VERIFICATION_INVALID_STATE", "Informasi hanya dapat diminta pada verifikasi PENDING.", 409);
  const organizationId = existing.organizationId ?? existing.opportunity?.buyerOrganizationId;
  const updated = await db.$transaction(async (transaction) => {
    const verification = await transaction.verification.update({ where: { id }, data: { notes: reason }, include: verificationInclude });
    await transaction.auditLog.create({ data: {
      actorUserId, actorOrganizationId: organizationId, action: "VERIFICATION_INFORMATION_REQUESTED", entityType: "Verification", entityId: id,
      beforeJson: { status: existing.status, notes: existing.notes }, afterJson: { status: existing.status, notes: reason },
      ipAddress: requestContext.ipAddress, userAgent: requestContext.userAgent,
    } });
    if (organizationId) {
      const members = await transaction.organizationMember.findMany({ where: { organizationId, status: "ACTIVE" }, select: { userId: true } });
      if (members.length) await transaction.notification.createMany({ data: members.map(({ userId }) => ({ userId, type: "VERIFICATION" as const, title: "Informasi verifikasi diperlukan", body: reason, entityType: "Verification", entityId: id })) });
    }
    return verification;
  });
  return toVerificationDto(updated);
}

export function toVerificationDto(item: VerificationRecord) {
  return {
    id: item.id, type: item.type, status: item.status, organizationId: item.organizationId, opportunityId: item.opportunityId,
    organization: item.organization, opportunity: item.opportunity, evidence: item.evidenceJson, notes: item.notes,
    reviewer: item.verifiedBy, verifiedAt: item.verifiedAt?.toISOString() ?? null, expiresAt: item.expiresAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(),
  };
}

export type VerificationData = ReturnType<typeof toVerificationDto>;
