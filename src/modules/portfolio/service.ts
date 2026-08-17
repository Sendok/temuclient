import { randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import type { CreatePortfolioInput, UpdatePortfolioInput } from "@/modules/portfolio/schema";
import { db } from "@/server/db/client";
import { recalculateMatchesForProvider } from "@/modules/matching/service";

const portfolioInclude = { industry: { select: { id: true, name: true, slug: true } }, technologies: { include: { technology: { select: { id: true, name: true, slug: true, category: true } } } } } as const;
function slugify(value: string) { return `${value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project"}-${randomUUID().slice(0, 8)}`; }

export async function listPortfolios(organizationId: string) { return (await db.portfolio.findMany({ where: { organizationId }, include: portfolioInclude, orderBy: { createdAt: "desc" } })).map(toSafePortfolioDto); }
export async function getPortfolio(organizationId: string, id: string) { const item = await db.portfolio.findFirst({ where: { id, organizationId }, include: portfolioInclude }); if (!item) throw new DomainError("NOT_FOUND", "Portfolio tidak ditemukan.", 404); return toOwnerPortfolioDto(item); }

export async function createPortfolio(organizationId: string, input: CreatePortfolioInput) {
  await validateReferences(input.industryId, input.technologyIds);
  const { technologyIds, ...data } = input;
  const item = await db.portfolio.create({ data: { ...data, organizationId, slug: slugify(input.title), technologies: { create: technologyIds.map((technologyId) => ({ technologyId })) } }, include: portfolioInclude });
  await recalculateMatchesForProvider(organizationId);
  return toSafePortfolioDto(item);
}

export async function updatePortfolio(organizationId: string, id: string, input: UpdatePortfolioInput) {
  const existing = await db.portfolio.findFirst({ where: { id, organizationId } });
  if (!existing) throw new DomainError("NOT_FOUND", "Portfolio tidak ditemukan.", 404);
  const confidential = input.isClientConfidential ?? existing.isClientConfidential;
  const clientName = input.clientName ?? existing.clientName;
  const valueMin = input.projectValueMin ?? existing.projectValueMin;
  const valueMax = input.projectValueMax ?? existing.projectValueMax;
  const startedAt = input.startedAt ?? existing.startedAt;
  const completedAt = input.completedAt ?? existing.completedAt;
  if (!confidential && !clientName) throw new DomainError("VALIDATION_ERROR", "Nama tampilan client diperlukan bila tidak confidential.", 400);
  if (valueMin !== null && valueMax !== null && valueMin > valueMax) throw new DomainError("VALIDATION_ERROR", "Nilai proyek maksimum harus lebih besar dari minimum.", 400);
  if (startedAt !== null && completedAt !== null && startedAt > completedAt) throw new DomainError("VALIDATION_ERROR", "Tanggal selesai harus setelah tanggal mulai.", 400);
  await validateReferences(input.industryId ?? undefined, input.technologyIds ?? []);
  const { technologyIds, ...data } = input;
  const item = await db.portfolio.update({ where: { id }, data: { ...data, ...(technologyIds ? { technologies: { deleteMany: {}, create: technologyIds.map((technologyId) => ({ technologyId })) } } : {}) }, include: portfolioInclude });
  await recalculateMatchesForProvider(organizationId);
  return toSafePortfolioDto(item);
}

export async function deletePortfolio(organizationId: string, id: string) { const result = await db.portfolio.deleteMany({ where: { id, organizationId } }); if (!result.count) throw new DomainError("NOT_FOUND", "Portfolio tidak ditemukan.", 404); await recalculateMatchesForProvider(organizationId); }

async function validateReferences(industryId?: string, technologyIds: string[] = []) {
  if (industryId && !await db.industry.findFirst({ where: { id: industryId, isActive: true }, select: { id: true } })) throw new DomainError("VALIDATION_ERROR", "Industri tidak valid.", 400);
  const uniqueIds = [...new Set(technologyIds)];
  if (uniqueIds.length !== technologyIds.length || await db.technology.count({ where: { id: { in: uniqueIds } } }) !== uniqueIds.length) throw new DomainError("VALIDATION_ERROR", "Pilihan teknologi tidak valid.", 400);
}

type PortfolioRecord = Prisma.PortfolioGetPayload<{ include: typeof portfolioInclude }>;
function toSafePortfolioDto(item: PortfolioRecord) { return { id: item.id, title: item.title, slug: item.slug, clientDisplayName: item.isClientConfidential ? `Confidential ${item.industry?.name ?? "Client"} Company` : item.clientName ?? "Client tidak ditampilkan", isClientConfidential: item.isClientConfidential, industry: item.industry, problem: item.problem, solution: item.solution, outcome: item.outcome, projectValueMin: item.projectValueMin?.toString() ?? null, projectValueMax: item.projectValueMax?.toString() ?? null, currency: item.currency, durationMonths: item.durationMonths, startedAt: item.startedAt?.toISOString() ?? null, completedAt: item.completedAt?.toISOString() ?? null, status: item.status, technologies: item.technologies.map(({ technology }) => technology) }; }
function toOwnerPortfolioDto(item: PortfolioRecord) { return { ...toSafePortfolioDto(item), clientName: item.clientName }; }
