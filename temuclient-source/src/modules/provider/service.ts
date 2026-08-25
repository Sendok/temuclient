import { DomainError } from "@/lib/errors/domain-error";
import { calculateProfileStrength } from "@/modules/provider/profile-strength";
import type { ProviderProfileUpdate } from "@/modules/provider/schema";
import { db } from "@/server/db/client";
import { recalculateMatchesForProvider } from "@/modules/matching/service";

export async function getProviderProfile(organizationId: string, emailVerified: boolean) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      services: { include: { serviceCategory: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      industries: { include: { industry: true }, orderBy: { industry: { sortOrder: "asc" } } },
      portfolios: { include: { industry: true, technologies: { include: { technology: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!organization || !["PROVIDER", "HYBRID"].includes(organization.type)) throw new DomainError("FORBIDDEN", "Profil Provider tidak tersedia untuk organisasi ini.", 403);
  const strength = calculateProfileStrength({ company: organization, services: organization.services, industryCount: organization.industries.length, portfolioCount: organization.portfolios.length, teamCapacity: organization.teamCapacity, availability: organization.availability, emailVerified });
  return {
    organization: { id: organization.id, name: organization.name, slug: organization.slug, type: organization.type, logoUrl: organization.logoUrl, website: organization.website, description: organization.description, country: organization.country, province: organization.province, city: organization.city, businessEmail: organization.businessEmail, phone: organization.phone, companySize: organization.companySize, teamCapacity: organization.teamCapacity, availability: organization.availability },
    services: organization.services.map((item) => ({ id: item.id, serviceCategoryId: item.serviceCategoryId, serviceCategory: { id: item.serviceCategory.id, name: item.serviceCategory.name, slug: item.serviceCategory.slug }, description: item.description, minProjectValue: item.minProjectValue?.toString() ?? null, maxProjectValue: item.maxProjectValue?.toString() ?? null, currency: item.currency, typicalDurationMin: item.typicalDurationMin, typicalDurationMax: item.typicalDurationMax, isPrimary: item.isPrimary })),
    industries: organization.industries.map((item) => ({ industryId: item.industryId, name: item.industry.name, slug: item.industry.slug, experienceLevel: item.experienceLevel })),
    portfolios: organization.portfolios.map(toPortfolioSummary),
    verificationSummary: { accountEmail: emailVerified, businessEmail: Boolean(organization.businessEmail), companyProfile: Boolean(organization.name && organization.description && organization.city) },
    profileStrength: strength,
  };
}

export type ProviderProfileData = Awaited<ReturnType<typeof getProviderProfile>>;

export async function updateProviderProfile(organizationId: string, input: ProviderProfileUpdate) {
  const { industrySelections, ...organizationData } = input;
  const updated = await db.$transaction(async (transaction) => {
    if (industrySelections) {
      const uniqueIds = [...new Set(industrySelections.map((item) => item.industryId))];
      if (uniqueIds.length !== industrySelections.length) throw new DomainError("VALIDATION_ERROR", "Industri tidak boleh duplikat.", 400);
      const validCount = await transaction.industry.count({ where: { id: { in: uniqueIds }, isActive: true } });
      if (validCount !== uniqueIds.length) throw new DomainError("VALIDATION_ERROR", "Pilihan industri tidak valid.", 400);
      await transaction.organizationIndustry.deleteMany({ where: { organizationId } });
      if (industrySelections.length) await transaction.organizationIndustry.createMany({ data: industrySelections.map((item) => ({ organizationId, industryId: item.industryId, experienceLevel: item.experienceLevel })) });
    }
    return transaction.organization.update({ where: { id: organizationId }, data: organizationData });
  });
  await recalculateMatchesForProvider(organizationId);
  return updated;
}

function toPortfolioSummary(item: { id: string; title: string; isClientConfidential: boolean; clientName: string | null; industry: { name: string } | null; problem: string; solution: string; outcome: string | null; status: string; technologies: { technology: { id: string; name: string } }[] }) {
  return { id: item.id, title: item.title, clientDisplayName: item.isClientConfidential ? `Confidential ${item.industry?.name ?? "Client"} Company` : item.clientName ?? "Client tidak ditampilkan", isClientConfidential: item.isClientConfidential, industryName: item.industry?.name ?? null, problem: item.problem, solution: item.solution, outcome: item.outcome, status: item.status, technologies: item.technologies.map(({ technology }) => technology) };
}
