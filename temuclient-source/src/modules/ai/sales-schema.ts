import { z } from "zod";

const id = z.string().trim().min(1).max(100);
const shortText = z.string().trim().min(1).max(500);
const textList = z.array(shortText).max(12);

export const opportunityAIInputSchema = z.object({ opportunityId: id });
export const meetingAIInputSchema = z.object({ meetingId: id });
export const discoveryAnalysisInputSchema = z.object({
  meetingId: id,
  notes: z.string().trim().min(20).max(12_000),
});
export const followUpInputSchema = z.object({
  conversationId: id,
  notes: z.string().trim().max(8_000).optional().default(""),
  tone: z.enum(["PROFESSIONAL", "CONCISE", "CONSULTATIVE"]).default("PROFESSIONAL"),
});
export const dealAIInputSchema = z.object({ dealId: id });
export const proposalOutlineInputSchema = z.object({
  dealId: id,
  notes: z.string().trim().max(8_000).optional().default(""),
});

export const opportunitySummarySchema = z.object({
  conciseProblem: shortText,
  scope: textList,
  budgetTimeline: shortText,
  risks: textList,
  recommendedReviewPoints: textList,
});

export const matchExplanationSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: shortText,
  strongestFactors: textList,
  gaps: textList,
  recommendedEvidence: textList,
});

export const meetingPrepSchema = z.object({
  companySnapshot: shortText,
  opportunitySummary: shortText,
  likelyPainPoints: textList,
  stakeholders: textList,
  recommendedDiscoveryQuestions: textList,
  relevantPortfolio: textList,
  potentialObjections: textList,
  desiredOutcome: shortText,
});

export const discoveryAnalysisSchema = z.object({
  painPoints: textList,
  buyingSignals: textList,
  decisionMakers: textList,
  budget: shortText,
  timeline: shortText,
  risks: textList,
  nextBestAction: shortText,
});

export const followUpDraftSchema = z.object({
  subject: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(5_000),
  reviewChecklist: textList,
  requiresReview: z.literal(true),
});

export const proposalOutlineSchema = z.object({
  problem: shortText,
  objective: shortText,
  recommendedSolution: textList,
  scope: textList,
  timeline: textList,
  deliverables: textList,
  commercialStructure: textList,
  assumptions: textList,
  requiresReview: z.literal(true),
});

export const dealHealthSchema = z.object({
  score: z.number().int().min(0).max(100),
  positiveSignals: textList,
  risks: textList,
  nextBestAction: shortText,
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export type AISalesFeature =
  | "opportunity_summary"
  | "match_explanation"
  | "meeting_prep"
  | "discovery_analysis"
  | "follow_up"
  | "proposal_outline"
  | "deal_health";

export type OpportunitySummary = z.infer<typeof opportunitySummarySchema>;
export type MatchExplanation = z.infer<typeof matchExplanationSchema>;
export type MeetingPrep = z.infer<typeof meetingPrepSchema>;
export type DiscoveryAnalysis = z.infer<typeof discoveryAnalysisSchema>;
export type FollowUpDraft = z.infer<typeof followUpDraftSchema>;
export type ProposalOutline = z.infer<typeof proposalOutlineSchema>;
export type DealHealth = z.infer<typeof dealHealthSchema>;
