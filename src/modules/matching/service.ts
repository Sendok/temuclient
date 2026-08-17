import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import {
  deterministicMatchingEngine,
  isBudgetViable,
} from "@/modules/matching/engine";
import type { ProviderFeedQuery } from "@/modules/matching/schema";
import type {
  MatchOpportunityInput,
  MatchProviderInput,
  MatchReason,
} from "@/modules/matching/types";
import { db } from "@/server/db/client";
import { consumeOpportunityAccess, getEffectiveEntitlements } from "@/modules/entitlements/access";

const providerOpportunityInclude = {
  opportunity: {
    include: {
      serviceCategory: { select: { id: true, name: true, slug: true } },
      industry: { select: { id: true, name: true, slug: true } },
      requirements: {
        orderBy: { sortOrder: "asc" as const },
        select: {
          id: true,
          category: true,
          label: true,
          description: true,
          priority: true,
          sortOrder: true,
        },
      },
      attachments: {
        where: { visibility: "PUBLIC_SUMMARY" as const },
        select: {
          id: true,
          name: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      },
      verifications: { select: { type: true, status: true } },
      saves: { select: { organizationId: true } },
    },
  },
} as const;

export interface MatchGenerationDispatcher {
  dispatch(opportunityId: string): Promise<number>;
}
export const synchronousMatchDispatcher: MatchGenerationDispatcher = {
  dispatch: generateMatchesForOpportunity,
};

export async function generateMatchesForOpportunity(opportunityId: string) {
  const opportunity = await db.opportunity.findFirst({
    where: { id: opportunityId, status: { in: ["ACTIVE", "MATCHING"] } },
    include: { requirements: { select: { label: true, description: true } } },
  });
  if (!opportunity?.serviceCategoryId) return 0;
  const candidates = await db.organization.findMany({
    where: {
      type: { in: ["PROVIDER", "HYBRID"] },
      status: "ACTIVE",
      services: { some: { serviceCategoryId: opportunity.serviceCategoryId } },
    },
    include: {
      services: { where: { serviceCategoryId: opportunity.serviceCategoryId } },
      industries: { select: { industryId: true } },
      portfolios: {
        where: { status: "PUBLISHED" },
        select: {
          industryId: true,
          problem: true,
          solution: true,
          outcome: true,
          technologies: { select: { technology: { select: { name: true } } } },
        },
      },
    },
  });
  const opportunityInput = toOpportunityInput(opportunity);
  const viable = candidates.filter((candidate) =>
    candidate.services.some((service) =>
      isBudgetViable(opportunityInput, service),
    ),
  );
  const results = viable.map((provider) => ({
    providerId: provider.id,
    result: deterministicMatchingEngine.calculate(
      opportunityInput,
      toProviderInput(provider),
    ),
  }));
  await db.$transaction(async (transaction) => {
    await transaction.opportunityMatch.deleteMany({
      where: {
        opportunityId,
        providerOrganizationId: {
          notIn: viable.map((provider) => provider.id),
        },
      },
    });
    for (const { providerId, result } of results) {
      const data = {
        totalScore: result.totalScore,
        serviceScore: result.factors.service,
        industryScore: result.factors.industry,
        budgetScore: result.factors.budget,
        portfolioScore: result.factors.portfolio,
        technologyScore: result.factors.technology,
        capacityScore: result.factors.capacity,
        locationScore: result.factors.location,
        availabilityScore: result.factors.availability,
        explanationJson: result.reasons as unknown as Prisma.InputJsonValue,
        algorithmVersion: result.algorithmVersion,
        calculatedAt: result.calculatedAt,
      };
      await transaction.opportunityMatch.upsert({
        where: {
          opportunityId_providerOrganizationId: {
            opportunityId,
            providerOrganizationId: providerId,
          },
        },
        update: data,
        create: { opportunityId, providerOrganizationId: providerId, ...data },
      });
    }
  });
  return results.length;
}

export async function recalculateMatchesForProvider(
  providerOrganizationId: string,
) {
  const services = await db.organizationService.findMany({
    where: { organizationId: providerOrganizationId },
    select: { serviceCategoryId: true },
  });
  const opportunities = await db.opportunity.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
      OR: [
        {
          serviceCategoryId: {
            in: services.map((item) => item.serviceCategoryId),
          },
        },
        { matches: { some: { providerOrganizationId } } },
      ],
    },
    select: { id: true },
  });
  for (const opportunity of opportunities)
    await synchronousMatchDispatcher.dispatch(opportunity.id);
  return opportunities.length;
}

export async function listProviderOpportunityFeed(
  providerOrganizationId: string,
  query: ProviderFeedQuery,
) {
  const access = await getEffectiveEntitlements(providerOrganizationId);
  const where: Prisma.OpportunityMatchWhereInput = {
    providerOrganizationId,
    totalScore:
      query.minScore === undefined ? undefined : { gte: query.minScore },
    opportunity: {
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
      serviceCategoryId: query.service,
      industryId: query.industry,
      city: query.city
        ? { equals: query.city, mode: "insensitive" }
        : undefined,
      OR: query.q
        ? [
            { title: { contains: query.q, mode: "insensitive" } },
            { problemStatement: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ]
        : undefined,
    },
  };
  const orderBy: Prisma.OpportunityMatchOrderByWithRelationInput[] =
    query.sort === "intent"
      ? [
          { opportunity: { intentScore: "desc" } },
          { totalScore: "desc" },
          { id: "asc" },
        ]
      : query.sort === "recent"
        ? [
            { opportunity: { publishedAt: "desc" } },
            { totalScore: "desc" },
            { id: "asc" },
          ]
        : [
            { totalScore: "desc" },
            { opportunity: { intentScore: "desc" } },
            { opportunity: { publishedAt: "desc" } },
            { id: "asc" },
          ];
  const rows = await db.opportunityMatch.findMany({
    where,
    include: {
      opportunity: {
        ...providerOpportunityInclude.opportunity,
        include: {
          ...providerOpportunityInclude.opportunity.include,
          saves: {
            where: { organizationId: providerOrganizationId },
            select: { organizationId: true },
          },
        },
      },
    },
    orderBy,
    take: query.limit + 1,
    cursor: query.cursor ? { id: query.cursor } : undefined,
    skip: query.cursor ? 1 : undefined,
  });
  const hasMore = rows.length > query.limit;
  const items = rows.slice(0, query.limit);
  return {
    items: items.map((item) => toProviderOpportunityDto(item, access.entitlements.matchIntelligence)),
    nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    access: { plan: access.plan, opportunityAccessPerMonth: access.entitlements.opportunityAccessPerMonth, matchIntelligence: access.entitlements.matchIntelligence },
  };
}

export async function getProviderOpportunity(
  providerOrganizationId: string,
  opportunityId: string,
  userId: string,
) {
  const access = await consumeOpportunityAccess(providerOrganizationId, opportunityId);
  const row = await db.opportunityMatch.findFirst({
    where: {
      providerOrganizationId,
      opportunityId,
      opportunity: { status: "ACTIVE", expiresAt: { gt: new Date() } },
    },
    include: {
      opportunity: {
        ...providerOpportunityInclude.opportunity,
        include: {
          ...providerOpportunityInclude.opportunity.include,
          saves: {
            where: { organizationId: providerOrganizationId },
            select: { organizationId: true },
          },
        },
      },
    },
  });
  if (!row)
    throw new DomainError(
      "NOT_FOUND",
      "Opportunity tidak tersedia untuk organisasi Anda.",
      404,
    );
  await db.analyticsEvent.create({
    data: {
      name: "opportunity_viewed",
      userId,
      organizationId: providerOrganizationId,
      entityType: "Opportunity",
      entityId: opportunityId,
    },
  });
  return toProviderOpportunityDto(row, access.entitlements.matchIntelligence);
}

export async function saveOpportunity(
  providerOrganizationId: string,
  userId: string,
  opportunityId: string,
) {
  await assertProviderCanView(providerOrganizationId, opportunityId);
  const saved = await db.$transaction(async (transaction) => {
    const result = await transaction.savedOpportunity.upsert({
      where: {
        opportunityId_organizationId: {
          opportunityId,
          organizationId: providerOrganizationId,
        },
      },
      update: {},
      create: {
        opportunityId,
        organizationId: providerOrganizationId,
        savedById: userId,
      },
    });
    await transaction.analyticsEvent.create({
      data: {
        name: "opportunity_saved",
        userId,
        organizationId: providerOrganizationId,
        entityType: "Opportunity",
        entityId: opportunityId,
      },
    });
    return result;
  });
  return { saved: true, savedAt: saved.createdAt.toISOString() };
}

export async function unsaveOpportunity(
  providerOrganizationId: string,
  opportunityId: string,
) {
  await db.savedOpportunity.deleteMany({
    where: { opportunityId, organizationId: providerOrganizationId },
  });
  return { saved: false };
}

export async function listBuyerOpportunityMatches(
  buyerOrganizationId: string,
  opportunityId: string,
) {
  await assertBuyerOwnsOpportunity(buyerOrganizationId, opportunityId);
  const rows = await db.opportunityMatch.findMany({
    where: { opportunityId },
    include: buyerMatchInclude,
    orderBy: [{ totalScore: "desc" }, { id: "asc" }],
  });
  return rows.map(toBuyerMatchDto);
}

export async function getMatchedProviderForBuyer(
  buyerOrganizationId: string,
  providerOrganizationId: string,
  opportunityId?: string,
) {
  const match = await db.opportunityMatch.findFirst({
    where: {
      providerOrganizationId,
      opportunityId,
      opportunity: { buyerOrganizationId },
    },
    include: buyerMatchInclude,
    orderBy: { totalScore: "desc" },
  });
  if (!match)
    throw new DomainError(
      "NOT_FOUND",
      "Provider tidak tersedia dalam hasil match organisasi Anda.",
      404,
    );
  return toBuyerMatchDto(match);
}

export async function compareMatchedProviders(
  buyerOrganizationId: string,
  opportunityId: string,
  providerIds: string[],
) {
  await assertBuyerOwnsOpportunity(buyerOrganizationId, opportunityId);
  if (
    providerIds.length < 1 ||
    providerIds.length > 3 ||
    new Set(providerIds).size !== providerIds.length
  )
    throw new DomainError(
      "VALIDATION_ERROR",
      "Pilih satu sampai tiga provider unik untuk dibandingkan.",
      400,
    );
  const rows = await db.opportunityMatch.findMany({
    where: { opportunityId, providerOrganizationId: { in: providerIds } },
    include: buyerMatchInclude,
    orderBy: { totalScore: "desc" },
  });
  if (rows.length !== providerIds.length)
    throw new DomainError(
      "FORBIDDEN",
      "Salah satu provider bukan hasil match requirement ini.",
      403,
    );
  return rows.map(toBuyerMatchDto);
}

async function assertProviderCanView(
  providerOrganizationId: string,
  opportunityId: string,
) {
  if (
    !(await db.opportunityMatch.findFirst({
      where: {
        providerOrganizationId,
        opportunityId,
        opportunity: { status: "ACTIVE", expiresAt: { gt: new Date() } },
      },
      select: { id: true },
    }))
  )
    throw new DomainError(
      "NOT_FOUND",
      "Opportunity tidak tersedia untuk organisasi Anda.",
      404,
    );
}
async function assertBuyerOwnsOpportunity(
  buyerOrganizationId: string,
  opportunityId: string,
) {
  if (
    !(await db.opportunity.findFirst({
      where: { id: opportunityId, buyerOrganizationId },
      select: { id: true },
    }))
  )
    throw new DomainError("NOT_FOUND", "Requirement tidak ditemukan.", 404);
}

const buyerMatchInclude = {
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
      portfolios: {
        where: { status: "PUBLISHED" as const },
        include: {
          industry: { select: { name: true } },
          technologies: {
            include: { technology: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" as const },
      },
      verifications: { select: { type: true, status: true } },
    },
  },
} as const;

function toOpportunityInput(opportunity: {
  serviceCategoryId: string | null;
  industryId: string | null;
  budgetMin: bigint | null;
  budgetMax: bigint | null;
  province: string | null;
  city: string | null;
  remoteAllowed: boolean;
  title: string;
  problemStatement: string;
  businessObjective: string | null;
  description: string | null;
  requirements: { label: string; description: string }[];
}): MatchOpportunityInput {
  return {
    serviceCategoryId: opportunity.serviceCategoryId,
    industryId: opportunity.industryId,
    budgetMin: opportunity.budgetMin,
    budgetMax: opportunity.budgetMax,
    province: opportunity.province,
    city: opportunity.city,
    remoteAllowed: opportunity.remoteAllowed,
    text: [
      opportunity.title,
      opportunity.problemStatement,
      opportunity.businessObjective,
      opportunity.description,
      ...opportunity.requirements.flatMap((item) => [
        item.label,
        item.description,
      ]),
    ]
      .filter(Boolean)
      .join(" "),
  };
}
function toProviderInput(provider: {
  services: {
    serviceCategoryId: string;
    minProjectValue: bigint | null;
    maxProjectValue: bigint | null;
  }[];
  industries: { industryId: string }[];
  portfolios: {
    industryId: string | null;
    problem: string;
    solution: string;
    outcome: string | null;
    technologies: { technology: { name: string } }[];
  }[];
  teamCapacity: number | null;
  province: string | null;
  city: string | null;
  availability: MatchProviderInput["availability"];
}): MatchProviderInput {
  return {
    services: provider.services,
    industryIds: provider.industries.map((item) => item.industryId),
    portfolios: provider.portfolios.map((item) => ({
      industryId: item.industryId,
      text: [item.problem, item.solution, item.outcome]
        .filter(Boolean)
        .join(" "),
      technologyNames: item.technologies.map(
        ({ technology }) => technology.name,
      ),
    })),
    teamCapacity: provider.teamCapacity,
    province: provider.province,
    city: provider.city,
    availability: provider.availability,
  };
}

function factors(row: {
  serviceScore: number;
  industryScore: number;
  budgetScore: number;
  portfolioScore: number;
  technologyScore: number;
  capacityScore: number;
  locationScore: number;
  availabilityScore: number;
}) {
  return {
    service: row.serviceScore,
    industry: row.industryScore,
    budget: row.budgetScore,
    portfolio: row.portfolioScore,
    technology: row.technologyScore,
    capacity: row.capacityScore,
    location: row.locationScore,
    availability: row.availabilityScore,
  };
}
/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma query results are narrowed at this serialization boundary. */
function toProviderOpportunityDto(row: any, includeIntelligence = true) {
  const opportunity = row.opportunity;
  return {
    matchId: row.id,
    id: opportunity.id,
    title: opportunity.title,
    serviceCategory: opportunity.serviceCategory,
    industry: opportunity.industry,
    problemStatement: opportunity.problemStatement,
    businessObjective: opportunity.businessObjective,
    description: opportunity.description,
    projectType: opportunity.projectType,
    budgetMin: opportunity.budgetMin?.toString() ?? null,
    budgetMax: opportunity.budgetMax?.toString() ?? null,
    currency: opportunity.currency,
    budgetStatus: opportunity.budgetStatus,
    timelineStart: opportunity.timelineStart?.toISOString() ?? null,
    timelineEnd: opportunity.timelineEnd?.toISOString() ?? null,
    country: opportunity.country,
    province: opportunity.province,
    city: opportunity.city,
    remoteAllowed: opportunity.remoteAllowed,
    preferredProviderLocation: opportunity.preferredProviderLocation,
    intentScore: opportunity.intentScore,
    intentLevel: opportunity.intentLevel,
    verificationLevel: opportunity.verificationLevel,
    verificationSummary: opportunity.verifications.map(
      (item: { type: string; status: string }) => item,
    ),
    publishedAt: opportunity.publishedAt?.toISOString() ?? null,
    expiresAt: opportunity.expiresAt?.toISOString() ?? null,
    requirements: opportunity.requirements,
    publicAttachments: opportunity.attachments.map((item: any) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    totalScore: row.totalScore,
    factors: includeIntelligence ? factors(row) : null,
    reasons: includeIntelligence ? row.explanationJson as MatchReason[] : null,
    matchIntelligenceAvailable: includeIntelligence,
    algorithmVersion: row.algorithmVersion,
    calculatedAt: row.calculatedAt.toISOString(),
    saved: opportunity.saves.length > 0,
  };
}
function toBuyerMatchDto(row: any) {
  const provider = row.providerOrganization;
  return {
    matchId: row.id,
    opportunityId: row.opportunityId,
    totalScore: row.totalScore,
    factors: factors(row),
    reasons: row.explanationJson as MatchReason[],
    algorithmVersion: row.algorithmVersion,
    calculatedAt: row.calculatedAt.toISOString(),
    provider: {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      logoUrl: provider.logoUrl,
      website: provider.website,
      description: provider.description,
      country: provider.country,
      province: provider.province,
      city: provider.city,
      companySize: provider.companySize,
      teamCapacity: provider.teamCapacity,
      availability: provider.availability,
      services: provider.services.map((item: any) => ({
        id: item.id,
        name: item.serviceCategory.name,
        slug: item.serviceCategory.slug,
        isPrimary: item.isPrimary,
        minProjectValue: item.minProjectValue?.toString() ?? null,
        maxProjectValue: item.maxProjectValue?.toString() ?? null,
      })),
      industries: provider.industries.map((item: any) => ({
        id: item.industry.id,
        name: item.industry.name,
        slug: item.industry.slug,
        experienceLevel: item.experienceLevel,
      })),
      portfolios: provider.portfolios.map((item: any) => ({
        id: item.id,
        title: item.title,
        clientDisplayName: item.isClientConfidential
          ? `Confidential ${item.industry?.name ?? "Client"} Company`
          : (item.clientName ?? "Client tidak ditampilkan"),
        industryName: item.industry?.name ?? null,
        problem: item.problem,
        solution: item.solution,
        outcome: item.outcome,
        technologies: item.technologies.map(
          ({ technology }: any) => technology,
        ),
      })),
      verificationSummary: provider.verifications.map((item: any) => item),
    },
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
export type ProviderOpportunityData = {
  matchId: string;
  id: string;
  title: string;
  serviceCategory: { id: string; name: string; slug: string } | null;
  industry: { id: string; name: string; slug: string } | null;
  problemStatement: string;
  businessObjective: string | null;
  description: string | null;
  projectType: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: string;
  budgetStatus: string | null;
  timelineStart: string | null;
  timelineEnd: string | null;
  country: string;
  province: string | null;
  city: string | null;
  remoteAllowed: boolean;
  preferredProviderLocation: string | null;
  intentScore: number;
  intentLevel: string;
  verificationLevel: number;
  verificationSummary: { type: string; status: string }[];
  publishedAt: string | null;
  expiresAt: string | null;
  requirements: {
    id: string;
    category: string;
    label: string;
    description: string;
    priority: string;
    sortOrder: number;
  }[];
  publicAttachments: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }[];
  totalScore: number;
  factors: ReturnType<typeof factors> | null;
  reasons: MatchReason[] | null;
  matchIntelligenceAvailable: boolean;
  algorithmVersion: string;
  calculatedAt: string;
  saved: boolean;
};
export type ProviderFeedData = {
  items: ProviderOpportunityData[];
  nextCursor: string | null;
  access: { plan: string; opportunityAccessPerMonth: number | null; matchIntelligence: boolean };
};
export type BuyerMatchData = {
  matchId: string;
  opportunityId: string;
  totalScore: number;
  factors: ReturnType<typeof factors>;
  reasons: MatchReason[];
  algorithmVersion: string;
  calculatedAt: string;
  provider: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    website: string | null;
    description: string | null;
    country: string;
    province: string | null;
    city: string | null;
    companySize: number | null;
    teamCapacity: number | null;
    availability: string | null;
    services: {
      id: string;
      name: string;
      slug: string;
      isPrimary: boolean;
      minProjectValue: string | null;
      maxProjectValue: string | null;
    }[];
    industries: {
      id: string;
      name: string;
      slug: string;
      experienceLevel: string | null;
    }[];
    portfolios: {
      id: string;
      title: string;
      clientDisplayName: string;
      industryName: string | null;
      problem: string;
      solution: string;
      outcome: string | null;
      technologies: { id: string; name: string }[];
    }[];
    verificationSummary: { type: string; status: string }[];
  };
};
