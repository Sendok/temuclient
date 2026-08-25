export const MATCHING_ALGORITHM_VERSION = "matching-v1";

export const MATCH_WEIGHTS = {
  service: 25,
  industry: 15,
  budget: 15,
  portfolio: 15,
  technology: 10,
  capacity: 10,
  location: 5,
  availability: 5,
} as const;

export type MatchReason = {
  factor: keyof typeof MATCH_WEIGHTS;
  score: number;
  maximum: number;
  message: string;
};

export type MatchOpportunityInput = {
  serviceCategoryId: string | null;
  industryId: string | null;
  budgetMin: bigint | null;
  budgetMax: bigint | null;
  province: string | null;
  city: string | null;
  remoteAllowed: boolean;
  text: string;
};

export type MatchProviderInput = {
  services: { serviceCategoryId: string; minProjectValue: bigint | null; maxProjectValue: bigint | null }[];
  industryIds: string[];
  portfolios: { industryId: string | null; text: string; technologyNames: string[] }[];
  teamCapacity: number | null;
  province: string | null;
  city: string | null;
  availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | null;
};

export type MatchResult = {
  totalScore: number;
  factors: Record<keyof typeof MATCH_WEIGHTS, number>;
  reasons: MatchReason[];
  algorithmVersion: typeof MATCHING_ALGORITHM_VERSION;
  calculatedAt: Date;
};

export interface MatchingEngine {
  calculate(opportunity: MatchOpportunityInput, provider: MatchProviderInput): MatchResult;
}
