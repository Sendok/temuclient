import { DomainError } from "@/lib/errors/domain-error";
import type { CreateOrganizationServiceInput, UpdateOrganizationServiceInput } from "@/modules/services/schema";
import { db } from "@/server/db/client";
import { recalculateMatchesForProvider } from "@/modules/matching/service";

const includeCategory = { serviceCategory: { select: { id: true, name: true, slug: true } } } as const;

export async function listOrganizationServices(organizationId: string) {
  return db.organizationService.findMany({ where: { organizationId }, include: includeCategory, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] }).then((items) => items.map(toServiceDto));
}

export async function createOrganizationService(organizationId: string, input: CreateOrganizationServiceInput) {
  const category = await db.serviceCategory.findFirst({ where: { id: input.serviceCategoryId, isActive: true }, select: { id: true } });
  if (!category) throw new DomainError("VALIDATION_ERROR", "Kategori layanan tidak valid.", 400);
  const exists = await db.organizationService.findUnique({ where: { organizationId_serviceCategoryId: { organizationId, serviceCategoryId: input.serviceCategoryId } } });
  if (exists) throw new DomainError("CONFLICT", "Layanan ini sudah ditambahkan.", 409);
  const created = await db.$transaction(async (transaction) => {
    if (input.isPrimary) await transaction.organizationService.updateMany({ where: { organizationId }, data: { isPrimary: false } });
    return transaction.organizationService.create({ data: { ...input, organizationId }, include: includeCategory });
  });
  await recalculateMatchesForProvider(organizationId);
  return toServiceDto(created);
}

export async function updateOrganizationService(organizationId: string, id: string, input: UpdateOrganizationServiceInput) {
  const existing = await db.organizationService.findFirst({ where: { id, organizationId }, include: includeCategory });
  if (!existing) throw new DomainError("NOT_FOUND", "Layanan tidak ditemukan.", 404);
  const min = input.minProjectValue ?? existing.minProjectValue;
  const max = input.maxProjectValue ?? existing.maxProjectValue;
  const durationMin = input.typicalDurationMin ?? existing.typicalDurationMin;
  const durationMax = input.typicalDurationMax ?? existing.typicalDurationMax;
  if (min !== null && max !== null && min > max) throw new DomainError("VALIDATION_ERROR", "Nilai proyek maksimum harus lebih besar dari minimum.", 400);
  if (durationMin !== null && durationMax !== null && durationMin > durationMax) throw new DomainError("VALIDATION_ERROR", "Durasi maksimum harus lebih besar dari minimum.", 400);
  const updated = await db.$transaction(async (transaction) => {
    if (input.isPrimary) await transaction.organizationService.updateMany({ where: { organizationId, id: { not: id } }, data: { isPrimary: false } });
    return transaction.organizationService.update({ where: { id }, data: input, include: includeCategory });
  });
  await recalculateMatchesForProvider(organizationId);
  return toServiceDto(updated);
}

export async function deleteOrganizationService(organizationId: string, id: string) {
  const result = await db.organizationService.deleteMany({ where: { id, organizationId } });
  if (!result.count) throw new DomainError("NOT_FOUND", "Layanan tidak ditemukan.", 404);
  await recalculateMatchesForProvider(organizationId);
}

function toServiceDto(item: { id: string; serviceCategoryId: string; description: string | null; minProjectValue: bigint | null; maxProjectValue: bigint | null; currency: string; typicalDurationMin: number | null; typicalDurationMax: number | null; isPrimary: boolean; serviceCategory: { id: string; name: string; slug: string } }) {
  return { ...item, minProjectValue: item.minProjectValue?.toString() ?? null, maxProjectValue: item.maxProjectValue?.toString() ?? null };
}
