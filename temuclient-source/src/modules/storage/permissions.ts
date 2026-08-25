import { DomainError } from "@/lib/errors/domain-error";
import { db } from "@/server/db/client";

export async function getAuthorizedAttachment(organizationId: string | null, isPlatformAdmin: boolean, id: string) {
  const attachment = await db.opportunityAttachment.findUnique({ where: { id }, include: { opportunity: { select: { id: true, status: true, buyerOrganizationId: true } } } });
  if (!attachment) throw new DomainError("NOT_FOUND", "Attachment tidak ditemukan.", 404);
  if (isPlatformAdmin || organizationId === attachment.opportunity.buyerOrganizationId) return attachment;
  if (!organizationId) throw new DomainError("FORBIDDEN", "Attachment tidak dapat diakses.", 403);
  if (attachment.visibility === "BUYER_ONLY") throw new DomainError("FORBIDDEN", "Attachment hanya tersedia untuk Buyer.", 403);
  if (attachment.visibility === "PUBLIC_SUMMARY") {
    const visible = await db.opportunityMatch.findUnique({ where: { opportunityId_providerOrganizationId: { opportunityId: attachment.opportunityId, providerOrganizationId: organizationId } }, select: { id: true } });
    if (visible) return attachment;
  }
  const accepted = await db.introduction.findFirst({ where: { opportunityId: attachment.opportunityId, providerOrganizationId: organizationId, status: "ACCEPTED" }, select: { id: true } });
  if (!accepted) throw new DomainError("FORBIDDEN", "Attachment baru tersedia setelah Introduction diterima.", 403);
  return attachment;
}
