import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import type { AdminListQuery, AuditLogQuery, FlagOpportunityInput } from "@/modules/admin/schema";
import type { AuditRequestContext } from "@/server/http/request-context";
import { db } from "@/server/db/client";

const pageMeta = (page: number, pageSize: number, total: number) => ({ page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
const paging = (query: AdminListQuery | AuditLogQuery) => ({ skip: (query.page - 1) * query.pageSize, take: query.pageSize });

export async function getAdminDashboard() {
  const [pendingVerification, activeOpportunities, flaggedOpportunities, providers, buyers, recentActions] = await Promise.all([
    db.verification.count({ where: { status: "PENDING" } }),
    db.opportunity.count({ where: { status: { in: ["ACTIVE", "MATCHING", "IN_DISCUSSION"] } } }),
    db.riskFlag.groupBy({ by: ["opportunityId"], where: { opportunityId: { not: null }, resolvedAt: null } }),
    db.organization.count({ where: { type: { in: ["PROVIDER", "HYBRID"] } } }),
    db.organization.count({ where: { type: { in: ["BUYER", "HYBRID"] } } }),
    db.auditLog.findMany({
      where: { action: { in: ["VERIFICATION_APPROVED", "VERIFICATION_REJECTED", "VERIFICATION_INFORMATION_REQUESTED", "ORGANIZATION_SUSPENDED", "OPPORTUNITY_FLAGGED"] } },
      include: { actorUser: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 8,
    }),
  ]);
  return {
    metrics: { pendingVerification, activeOpportunities, flaggedOpportunities: flaggedOpportunities.length, providers, buyers },
    recentActions: recentActions.map((item) => ({ id: item.id, action: item.action, entityType: item.entityType, entityId: item.entityId, actor: item.actorUser, createdAt: item.createdAt.toISOString() })),
  };
}

export async function listAdminUsers(query: AdminListQuery) {
  const where: Prisma.UserWhereInput = {
    status: query.status as Prisma.EnumUserStatusFilter | undefined,
    ...(query.q ? { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { email: { contains: query.q, mode: "insensitive" } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.user.findMany({ where, ...paging(query), orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, status: true, platformRole: true, lastLoginAt: true, createdAt: true, memberships: { where: { status: "ACTIVE" }, select: { role: true, organization: { select: { id: true, name: true, type: true, status: true } } } } } }),
    db.user.count({ where }),
  ]);
  return { items: items.map((item) => ({ ...item, lastLoginAt: item.lastLoginAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString() })), meta: pageMeta(query.page, query.pageSize, total) };
}

export async function listAdminOrganizations(query: AdminListQuery) {
  const where: Prisma.OrganizationWhereInput = {
    status: query.status,
    type: query.type as Prisma.EnumOrganizationTypeFilter | undefined,
    ...(query.q ? { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { businessEmail: { contains: query.q, mode: "insensitive" } }, { city: { contains: query.q, mode: "insensitive" } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.organization.findMany({ where, ...paging(query), orderBy: { createdAt: "desc" }, include: { _count: { select: { members: true, buyerOpportunities: true, riskFlags: { where: { resolvedAt: null } } } }, verifications: { orderBy: { createdAt: "desc" }, select: { id: true, type: true, status: true, createdAt: true } } } }),
    db.organization.count({ where }),
  ]);
  return { items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), verifications: item.verifications.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })) })), meta: pageMeta(query.page, query.pageSize, total) };
}

export async function getAdminOrganization(id: string) {
  const item = await db.organization.findUnique({ where: { id }, include: {
    members: { include: { user: { select: { id: true, name: true, email: true, status: true, lastLoginAt: true } } }, orderBy: { joinedAt: "asc" } },
    verifications: { include: { verifiedBy: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } },
    services: { include: { serviceCategory: { select: { name: true } } } },
    portfolios: { select: { id: true, title: true, status: true, createdAt: true } },
    buyerOpportunities: { select: { id: true, title: true, status: true, intentScore: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 },
    riskFlags: { where: { resolvedAt: null }, include: { createdBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
  } });
  if (!item) throw new DomainError("NOT_FOUND", "Perusahaan tidak ditemukan.", 404);
  return serialize({ ...item, riskSignals: deriveRiskSignals(item) });
}

export async function suspendOrganization(actorUserId: string, id: string, reason: string, context: AuditRequestContext = {}) {
  const existing = await db.organization.findUnique({ where: { id } });
  if (!existing) throw new DomainError("NOT_FOUND", "Perusahaan tidak ditemukan.", 404);
  if (existing.status === "SUSPENDED") throw new DomainError("CONFLICT", "Organisasi sudah ditangguhkan.", 409);
  const updated = await db.$transaction(async (transaction) => {
    const organization = await transaction.organization.update({ where: { id }, data: { status: "SUSPENDED" } });
    await transaction.auditLog.create({ data: { actorUserId, actorOrganizationId: id, action: "ORGANIZATION_SUSPENDED", entityType: "Organization", entityId: id, beforeJson: { status: existing.status }, afterJson: { status: "SUSPENDED" }, metadataJson: { reason }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
    const members = await transaction.organizationMember.findMany({ where: { organizationId: id, status: "ACTIVE" }, select: { userId: true } });
    if (members.length) await transaction.notification.createMany({ data: members.map(({ userId }) => ({ userId, type: "SYSTEM" as const, title: "Organisasi ditangguhkan", body: `Mutasi komersial baru dinonaktifkan selama peninjauan. ${reason}`, entityType: "Organization", entityId: id })) });
    return organization;
  });
  return serialize(updated);
}

export async function listAdminOpportunities(query: AdminListQuery) {
  const where: Prisma.OpportunityWhereInput = { status: query.status as Prisma.EnumOpportunityStatusFilter | undefined, ...(query.q ? { OR: [{ title: { contains: query.q, mode: "insensitive" } }, { buyerOrganization: { name: { contains: query.q, mode: "insensitive" } } }] } : {}) };
  const [items, total] = await Promise.all([
    db.opportunity.findMany({ where, ...paging(query), orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, intentScore: true, verificationLevel: true, budgetMin: true, budgetMax: true, currency: true, createdAt: true, buyerOrganization: { select: { id: true, name: true, status: true } }, _count: { select: { riskFlags: { where: { resolvedAt: null } } } } } }),
    db.opportunity.count({ where }),
  ]);
  return { items: items.map(serialize), meta: pageMeta(query.page, query.pageSize, total) };
}

export async function getAdminOpportunity(id: string) {
  const item = await db.opportunity.findUnique({ where: { id }, include: {
    buyerOrganization: { include: { members: { where: { status: "ACTIVE" }, include: { user: { select: { id: true, name: true, email: true, status: true } } } }, verifications: { orderBy: { createdAt: "desc" } } } },
    serviceCategory: true, industry: true, requirements: { orderBy: { sortOrder: "asc" } }, verifications: { include: { verifiedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    riskFlags: { where: { resolvedAt: null }, include: { createdBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
  } });
  if (!item) throw new DomainError("NOT_FOUND", "Opportunity tidak ditemukan.", 404);
  const duplicateCount = await db.opportunity.count({ where: { buyerOrganizationId: item.buyerOrganizationId, title: { equals: item.title, mode: "insensitive" }, id: { not: item.id } } });
  return serialize({ ...item, riskSignals: deriveRiskSignals(item.buyerOrganization, duplicateCount) });
}

export async function listAdminVerifications(query: AdminListQuery) {
  const where: Prisma.VerificationWhereInput = {
    status: query.status as Prisma.EnumVerificationStatusFilter | undefined,
    type: query.type as Prisma.EnumVerificationTypeFilter | undefined,
    ...(query.q ? { OR: [{ organization: { name: { contains: query.q, mode: "insensitive" } } }, { opportunity: { title: { contains: query.q, mode: "insensitive" } } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.verification.findMany({ where, ...paging(query), orderBy: [{ status: "asc" }, { createdAt: "asc" }], include: { organization: { select: { id: true, name: true, type: true, status: true } }, opportunity: { select: { id: true, title: true, buyerOrganizationId: true } }, verifiedBy: { select: { id: true, name: true, email: true } } } }),
    db.verification.count({ where }),
  ]);
  return { items: items.map(serialize), meta: pageMeta(query.page, query.pageSize, total) };
}

export async function flagOpportunity(actorUserId: string, id: string, input: FlagOpportunityInput, context: AuditRequestContext = {}) {
  const opportunity = await db.opportunity.findUnique({ where: { id }, select: { id: true, buyerOrganizationId: true, title: true } });
  if (!opportunity) throw new DomainError("NOT_FOUND", "Opportunity tidak ditemukan.", 404);
  const flag = await db.$transaction(async (transaction) => {
    const created = await transaction.riskFlag.create({ data: { opportunityId: id, organizationId: opportunity.buyerOrganizationId, signal: input.signal, severity: input.severity, reason: input.reason, source: "MANUAL", createdById: actorUserId } });
    await transaction.auditLog.create({ data: { actorUserId, actorOrganizationId: opportunity.buyerOrganizationId, action: "OPPORTUNITY_FLAGGED", entityType: "Opportunity", entityId: id, afterJson: { flagId: created.id, signal: created.signal, severity: created.severity, reason: created.reason }, ipAddress: context.ipAddress, userAgent: context.userAgent } });
    return created;
  });
  return serialize(flag);
}

export async function listAdminAuditLogs(query: AuditLogQuery) {
  const where: Prisma.AuditLogWhereInput = {
    action: query.action ? { contains: query.action, mode: "insensitive" } : undefined,
    entityType: query.entityType,
    actorUser: query.actor ? { OR: [{ name: { contains: query.actor, mode: "insensitive" } }, { email: { contains: query.actor, mode: "insensitive" } }] } : undefined,
  };
  const [items, total] = await Promise.all([
    db.auditLog.findMany({ where, ...paging(query), orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: { actorUser: { select: { id: true, name: true, email: true, platformRole: true } }, actorOrganization: { select: { id: true, name: true } } } }),
    db.auditLog.count({ where }),
  ]);
  return { items: items.map(serialize), meta: pageMeta(query.page, query.pageSize, total) };
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item instanceof Date ? item.toISOString() : item));
}

export function deriveRiskSignals(
  organization: { website: string | null; businessEmail: string | null; status: string; verifications: { status: string }[]; buyerOpportunities?: { title: string }[] },
  knownDuplicateCount?: number,
) {
  const signals: { signal: string; severity: string; description: string }[] = [];
  if (organization.status !== "ACTIVE") signals.push({ signal: "ACCOUNT_STATUS", severity: "HIGH", description: `Organization status is ${organization.status}.` });
  const websiteDomain = domainFromWebsite(organization.website);
  const emailDomain = organization.businessEmail?.split("@")[1]?.toLowerCase();
  if (websiteDomain && emailDomain && websiteDomain !== emailDomain && !websiteDomain.endsWith(`.${emailDomain}`) && !emailDomain.endsWith(`.${websiteDomain}`)) {
    signals.push({ signal: "DOMAIN_MISMATCH", severity: "MEDIUM", description: `Website domain ${websiteDomain} differs from business email ${emailDomain}.` });
  }
  const rejected = organization.verifications.filter((item) => item.status === "REJECTED").length;
  if (rejected >= 2) signals.push({ signal: "REPEATED_REJECTION", severity: "HIGH", description: `${rejected} verification attempts were rejected.` });
  const opportunityTitles = organization.buyerOpportunities?.map((item) => item.title.trim().toLowerCase()) ?? [];
  const duplicateCount = knownDuplicateCount ?? opportunityTitles.length - new Set(opportunityTitles).size;
  if (duplicateCount > 0) signals.push({ signal: "DUPLICATE_SUBMISSION", severity: "MEDIUM", description: `${duplicateCount} duplicate opportunity submission(s) detected.` });
  return signals;
}

function domainFromWebsite(value: string | null) {
  if (!value) return undefined;
  try { return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return undefined; }
}
