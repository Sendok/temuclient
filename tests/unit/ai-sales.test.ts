import { describe, expect, it } from "vitest";

import { getAIProvider } from "../../src/modules/ai/provider-registry";
import { DeterministicAIProvider } from "../../src/modules/ai/providers/deterministic";
import {
  dealHealthSchema,
  discoveryAnalysisInputSchema,
  followUpDraftSchema,
  meetingPrepSchema,
  proposalOutlineSchema,
} from "../../src/modules/ai/sales-schema";

describe("Phase 8 AI Sales validation and provider abstraction", () => {
  it("selects a deterministic fallback without requiring a vendor secret", () => {
    const provider = getAIProvider({ ...process.env, AI_PROVIDER: "deterministic" });
    expect(provider).toBeInstanceOf(DeterministicAIProvider);
    expect(provider.mode).toBe("fallback");
  });

  it("returns a loggable unavailable provider when a production secret is missing", async () => {
    const provider = getAIProvider({ ...process.env, AI_PROVIDER: "gemini", GEMINI_API_KEY: "" });
    expect(provider.name).toBe("gemini");
    await expect(provider.generateText({ system: "test", prompt: "test" })).rejects.toMatchObject({
      code: "AI_PROVIDER_UNAVAILABLE",
    });
  });

  it("validates structured output and refuses false precision or autonomous drafts", () => {
    expect(() => dealHealthSchema.parse({
      score: 101,
      positiveSignals: [],
      risks: [],
      nextBestAction: "Follow up",
      confidence: "CERTAIN",
    })).toThrow();
    expect(() => followUpDraftSchema.parse({
      subject: "Follow up",
      body: "Body",
      reviewChecklist: [],
      requiresReview: false,
    })).toThrow();
    expect(() => proposalOutlineSchema.parse({
      problem: "Problem",
      objective: "Objective",
      recommendedSolution: [],
      scope: [],
      timeline: [],
      deliverables: [],
      commercialStructure: [],
      assumptions: [],
      requiresReview: false,
    })).toThrow();
  });

  it("bounds user notes and requires useful discovery context", () => {
    expect(() => discoveryAnalysisInputSchema.parse({ meetingId: "meeting", notes: "too short" })).toThrow();
    expect(discoveryAnalysisInputSchema.parse({
      meetingId: "meeting",
      notes: "Buyer menjelaskan proses manual dan target implementasi tiga bulan.",
    }).notes).toContain("proses manual");
  });

  it("requires every Meeting Prep section", () => {
    expect(() => meetingPrepSchema.parse({ companySnapshot: "Company" })).toThrow();
  });
});
