import { randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import { calculateBuyerIntent } from "@/modules/opportunities/intent-score";
import { synchronousMatchDispatcher } from "@/modules/matching/service";
import { assertPublishable } from "@/modules/opportunities/publish-validation";
import type { AttachmentMetadataInput, CreateOpportunityInput, UpdateOpportunityInput } from "@/modules/opportunities/schema";
import { assertOpportunityTransition } from "@/modules/opportunities/state-machine";
import { db } from "@/server/db/client";
import { isOrganizationStorageKey } from "@/modules/storage/service";

const opportunityInclude = { serviceCategory: { select: { id: true, name: true, slug: true } }, industry: { select: { id: true, name: true, slug: true } }, requirements: { orderBy: { sortOrder: "asc" } }, attachments: { orderBy: { createdAt: "asc" } }, verifications: { select: { id: true, type: true, status: true, verifiedAt: true } } } as const;
type OpportunityRecord = Prisma.OpportunityGetPayload<{ include: typeof opportunityInclude }>;
const slugify = (value: string) => `${value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "requirement"}-${randomUUID().slice(0, 8)}`;

export async function listBuyerOpportunities(organizationId: string) { return (await db.opportunity.findMany({ where: { buyerOrganizationId: organizationId }, include: opportunityInclude, orderBy: { updatedAt: "desc" } })).map(toBuyerOpportunityDto); }
export async function getBuyerOpportunity(organizationId: string, id: string) { const item = await db.opportunity.findFirst({ where: { id, buyerOrganizationId: organizationId }, include: opportunityInclude }); if (!item) throw new DomainError("NOT_FOUND", "Opportunity tidak ditemukan.", 404); return toBuyerOpportunityDto(item); }

export async function createOpportunityDraft(organizationId: string, userId: string, input: CreateOpportunityInput) {
  await validateTaxonomy(input.serviceCategoryId, input.industryId);
  const initial = input.initialDescription ?? input.problemStatement ?? "";
  const title = input.title ?? initial.split(/[.!?\n]/)[0]?.slice(0, 120) ?? "Requirement baru";
  const { requirements, markForReview: _, initialDescription: __, ...data } = input;
  void _; void __;
  const created = await db.$transaction(async (transaction) => {
    const item = await transaction.opportunity.create({ data: { ...data, title, slug: slugify(title), problemStatement: input.problemStatement ?? initial, buyerOrganizationId: organizationId, createdById: userId, requirements: requirements?.length ? { create: requirements } : undefined }, include: opportunityInclude });
    await transaction.auditLog.create({ data: { actorUserId: userId, actorOrganizationId: organizationId, action: "OPPORTUNITY_CREATED", entityType: "Opportunity", entityId: item.id, afterJson: { status: item.status } } });
    await transaction.analyticsEvent.create({ data: { name: "opportunity_created", userId, organizationId, entityType: "Opportunity", entityId: item.id } });
    return item;
  });
  return toBuyerOpportunityDto(created);
}

export async function updateOpportunityDraft(organizationId: string, userId: string, id: string, input: UpdateOpportunityInput) {
  const existing = await db.opportunity.findFirst({ where: { id, buyerOrganizationId: organizationId }, include: { requirements: true } });
  if (!existing) throw new DomainError("NOT_FOUND", "Opportunity tidak ditemukan.", 404);
  if (!["DRAFT", "REVIEW"].includes(existing.status)) throw new DomainError("OPPORTUNITY_INVALID_STATE", "Hanya draft atau review yang dapat diedit.", 409);
  await validateTaxonomy(input.serviceCategoryId, input.industryId);
  const budgetMin = input.budgetMin ?? existing.budgetMin; const budgetMax = input.budgetMax ?? existing.budgetMax;
  const timelineStart = input.timelineStart ?? existing.timelineStart; const timelineEnd = input.timelineEnd ?? existing.timelineEnd;
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) throw new DomainError("VALIDATION_ERROR", "Budget maksimum harus lebih besar dari minimum.", 400);
  if (timelineStart !== null && timelineEnd !== null && timelineStart > timelineEnd) throw new DomainError("VALIDATION_ERROR", "Timeline selesai harus setelah tanggal mulai.", 400);
  const { requirements, markForReview, ...data } = input;
  const nextStatus = markForReview && existing.status === "DRAFT" ? "REVIEW" : existing.status;
  if (nextStatus !== existing.status) assertOpportunityTransition(existing.status, nextStatus);
  const updated = await db.$transaction(async (transaction) => {
    if (requirements) { await transaction.opportunityRequirement.deleteMany({ where: { opportunityId: id } }); if (requirements.length) await transaction.opportunityRequirement.createMany({ data: requirements.map((item) => ({ ...item, opportunityId: id })) }); }
    const item = await transaction.opportunity.update({ where: { id }, data: { ...data, status: nextStatus }, include: opportunityInclude });
    await transaction.auditLog.create({ data: { actorUserId: userId, actorOrganizationId: organizationId, action: "OPPORTUNITY_UPDATED", entityType: "Opportunity", entityId: id, beforeJson: { status: existing.status }, afterJson: { status: item.status } } });
    return item;
  });
  return toBuyerOpportunityDto(updated);
}

export async function publishOpportunity(organizationId: string, userId: string, id: string, accountEmailVerified: boolean) {
  const existing = await db.opportunity.findFirst({ where: { id, buyerOrganizationId: organizationId }, include: { requirements: true, buyerOrganization: true } });
  if (!existing) throw new DomainError("NOT_FOUND", "Opportunity tidak ditemukan.", 404);
  if (!["DRAFT", "REVIEW"].includes(existing.status)) throw new DomainError("OPPORTUNITY_INVALID_STATE", "Opportunity tidak dapat dipublish dari status saat ini.", 409);
  assertPublishable(existing, existing.buyerOrganization.status);
  if (existing.status === "DRAFT") assertOpportunityTransition("DRAFT", "REVIEW");
  assertOpportunityTransition("REVIEW", "ACTIVE");
  const intent = calculateBuyerIntent({ ...existing, requirementCount: existing.requirements.length, companyBusinessEmail: Boolean(existing.buyerOrganization.businessEmail), accountEmailVerified, reviewed: true });
  const now = new Date();
  const updated = await db.$transaction(async (transaction) => {
    const item = await transaction.opportunity.update({ where: { id }, data: { status: "ACTIVE", intentScore: intent.score, intentLevel: intent.level, intentAlgorithmVersion: intent.version, intentCalculatedAt: now, publishedAt: now, expiresAt: existing.expiresAt ?? new Date(now.getTime() + 30 * 86_400_000) }, include: opportunityInclude });
    const verificationExists = await transaction.verification.findFirst({ where: { opportunityId: id, type: "REQUIREMENT" } });
    if (!verificationExists) await transaction.verification.create({ data: { opportunityId: id, organizationId, type: "REQUIREMENT", status: "PENDING" } });
    await transaction.auditLog.create({ data: { actorUserId: userId, actorOrganizationId: organizationId, action: "OPPORTUNITY_PUBLISHED", entityType: "Opportunity", entityId: id, beforeJson: { status: existing.status }, afterJson: { status: "ACTIVE", intentScore: intent.score, intentLevel: intent.level }, metadataJson: { intentVersion: intent.version } } });
    await transaction.analyticsEvent.create({ data: { name: "opportunity_published", userId, organizationId, entityType: "Opportunity", entityId: id, propertiesJson: { intentScore: intent.score, intentLevel: intent.level } } });
    return item;
  });
  await synchronousMatchDispatcher.dispatch(id);
  return { ...toBuyerOpportunityDto(updated), intentBreakdown: intent.breakdown };
}

export async function pauseOpportunity(organizationId: string, userId: string, id: string) { return transitionOpportunity(organizationId, userId, id, "PAUSED", "OPPORTUNITY_PAUSED"); }
export async function cancelOpportunity(organizationId: string, userId: string, id: string) { return transitionOpportunity(organizationId, userId, id, "CANCELLED", "OPPORTUNITY_CANCELLED"); }
async function transitionOpportunity(organizationId: string, userId: string, id: string, to: "PAUSED" | "CANCELLED", action: string) { const existing = await db.opportunity.findFirst({ where: { id, buyerOrganizationId: organizationId } }); if (!existing) throw new DomainError("NOT_FOUND", "Opportunity tidak ditemukan.", 404); assertOpportunityTransition(existing.status, to); const item = await db.$transaction(async (transaction) => { const changed = await transaction.opportunity.update({ where: { id }, data: { status: to }, include: opportunityInclude }); await transaction.auditLog.create({ data: { actorUserId: userId, actorOrganizationId: organizationId, action, entityType: "Opportunity", entityId: id, beforeJson: { status: existing.status }, afterJson: { status: to } } }); return changed; }); return toBuyerOpportunityDto(item); }

export async function extendOpportunity(organizationId: string, userId: string, id: string, days: number) { const existing = await db.opportunity.findFirst({ where: { id, buyerOrganizationId: organizationId } }); if (!existing) throw new DomainError("NOT_FOUND", "Opportunity tidak ditemukan.", 404); if (!["ACTIVE", "PAUSED", "EXPIRED"].includes(existing.status)) throw new DomainError("OPPORTUNITY_INVALID_STATE", "Opportunity tidak dapat diperpanjang dari status saat ini.", 409); const nextStatus = existing.status === "EXPIRED" ? "ACTIVE" : existing.status; if (nextStatus !== existing.status) assertOpportunityTransition(existing.status, nextStatus); const base = existing.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : new Date(); const expiresAt = new Date(base.getTime() + days * 86_400_000); const item = await db.$transaction(async (transaction) => { const changed = await transaction.opportunity.update({ where: { id }, data: { expiresAt, status: nextStatus }, include: opportunityInclude }); await transaction.auditLog.create({ data: { actorUserId: userId, actorOrganizationId: organizationId, action: "OPPORTUNITY_EXTENDED", entityType: "Opportunity", entityId: id, beforeJson: { status: existing.status, expiresAt: existing.expiresAt?.toISOString() }, afterJson: { status: nextStatus, expiresAt: expiresAt.toISOString() } } }); return changed; }); if (nextStatus === "ACTIVE") await synchronousMatchDispatcher.dispatch(id); return toBuyerOpportunityDto(item); }

export async function addAttachmentMetadata(organizationId: string, userId: string, opportunityId: string, input: AttachmentMetadataInput) { const opportunity = await db.opportunity.findFirst({ where: { id: opportunityId, buyerOrganizationId: organizationId } }); if (!opportunity) throw new DomainError("NOT_FOUND", "Opportunity tidak ditemukan.", 404); if (!["DRAFT", "REVIEW"].includes(opportunity.status)) throw new DomainError("OPPORTUNITY_INVALID_STATE", "Attachment hanya dapat ditambahkan pada draft atau review.", 409); if (input.storageKey && !isOrganizationStorageKey(input.storageKey, organizationId)) throw new DomainError("FORBIDDEN", "Storage key tidak valid untuk organisasi ini.", 403); const item = await db.opportunityAttachment.create({ data: { ...input, opportunityId, uploadedById: userId, storageKey: input.storageKey ?? `pending/${organizationId}/${randomUUID()}` } }); return { id: item.id, name: item.name, mimeType: item.mimeType, size: item.size, visibility: item.visibility, createdAt: item.createdAt.toISOString() }; }

async function validateTaxonomy(serviceCategoryId?: string, industryId?: string) { if (serviceCategoryId && !await db.serviceCategory.findFirst({ where: { id: serviceCategoryId, isActive: true } })) throw new DomainError("VALIDATION_ERROR", "Kategori layanan tidak valid.", 400); if (industryId && !await db.industry.findFirst({ where: { id: industryId, isActive: true } })) throw new DomainError("VALIDATION_ERROR", "Industri tidak valid.", 400); }
function toBuyerOpportunityDto(item: OpportunityRecord) { return { id: item.id, title: item.title, slug: item.slug, serviceCategoryId: item.serviceCategoryId, serviceCategory: item.serviceCategory, industryId: item.industryId, industry: item.industry, problemStatement: item.problemStatement, businessObjective: item.businessObjective, description: item.description, projectType: item.projectType, budgetMin: item.budgetMin?.toString() ?? null, budgetMax: item.budgetMax?.toString() ?? null, currency: item.currency, budgetStatus: item.budgetStatus, timelineStart: item.timelineStart?.toISOString() ?? null, timelineEnd: item.timelineEnd?.toISOString() ?? null, country: item.country, province: item.province, city: item.city, remoteAllowed: item.remoteAllowed, preferredProviderLocation: item.preferredProviderLocation, decisionMakerInvolved: item.decisionMakerInvolved, intentScore: item.intentScore, intentLevel: item.intentLevel, intentAlgorithmVersion: item.intentAlgorithmVersion, intentCalculatedAt: item.intentCalculatedAt?.toISOString() ?? null, verificationLevel: item.verificationLevel, status: item.status, publishedAt: item.publishedAt?.toISOString() ?? null, expiresAt: item.expiresAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), requirements: item.requirements.map((requirement) => ({ id: requirement.id, category: requirement.category, label: requirement.label, description: requirement.description, priority: requirement.priority, sortOrder: requirement.sortOrder })), attachments: item.attachments.map((attachment) => ({ id: attachment.id, name: attachment.name, mimeType: attachment.mimeType, size: attachment.size, visibility: attachment.visibility, createdAt: attachment.createdAt.toISOString() })), verifications: item.verifications.map((verification) => ({ ...verification, verifiedAt: verification.verifiedAt?.toISOString() ?? null })) }; }
export type BuyerOpportunityData = Awaited<ReturnType<typeof getBuyerOpportunity>>;
