import { z } from "zod";

import { db } from "@/server/db/client";

export const requirementTextSchema = z.object({ text: z.string().trim().min(20).max(5000) });
const analysisSchema = z.object({ summary: z.string(), detectedProblem: z.string(), missingInformation: z.array(z.string()), mode: z.enum(["provider", "fallback"]) });
const questionsSchema = z.object({ questions: z.array(z.string()).min(1).max(5), mode: z.enum(["provider", "fallback"]) });
const structureSchema = z.object({ title: z.string(), problemStatement: z.string(), businessObjective: z.string(), description: z.string(), requirements: z.array(z.object({ category: z.string(), label: z.string(), description: z.string(), priority: z.enum(["MUST_HAVE", "SHOULD_HAVE", "NICE_TO_HAVE"]), sortOrder: z.number() })), mode: z.enum(["provider", "fallback"]) });

export interface RequirementAssistant { analyze(text: string): Promise<z.infer<typeof analysisSchema>>; questions(text: string): Promise<z.infer<typeof questionsSchema>>; structure(text: string): Promise<z.infer<typeof structureSchema>>; }

class DeterministicFallbackAssistant implements RequirementAssistant {
  async analyze(text: string) { return analysisSchema.parse({ summary: text.slice(0, 240), detectedProblem: text, missingInformation: ["Tujuan bisnis", "Budget", "Timeline", "Lokasi", "Decision maker"], mode: "fallback" }); }
  async questions() { return questionsSchema.parse({ questions: ["Apa hasil bisnis utama yang ingin dicapai?", "Berapa rentang budget yang telah disiapkan?", "Kapan solusi perlu mulai digunakan?", "Siapa yang terlibat dalam keputusan pembelian?", "Apakah Provider dapat bekerja secara remote?"], mode: "fallback" }); }
  async structure(text: string) { const title = text.split(/[.!?\n]/)[0]?.slice(0, 120) || "Requirement baru"; return structureSchema.parse({ title, problemStatement: text, businessObjective: "Lengkapi tujuan bisnis pada tahap review.", description: text, requirements: [{ category: "BUSINESS", label: "Kebutuhan utama", description: text, priority: "MUST_HAVE", sortOrder: 0 }], mode: "fallback" }); }
}

export function getRequirementAssistant(): RequirementAssistant { return new DeterministicFallbackAssistant(); }

export async function executeRequirementAssistant(feature: "analyze" | "questions" | "structure", text: string, userId: string, organizationId: string) {
  const startedAt = Date.now();
  try {
    const assistant = getRequirementAssistant();
    const result = feature === "analyze" ? await assistant.analyze(text) : feature === "questions" ? await assistant.questions(text) : await assistant.structure(text);
    await db.aIExecution.create({ data: { userId, organizationId, feature: `requirement_${feature}`, provider: "deterministic", model: "fallback-v1", latencyMs: Date.now() - startedAt, status: "SUCCESS" } });
    return result;
  } catch (error) {
    await db.aIExecution.create({ data: { userId, organizationId, feature: `requirement_${feature}`, provider: "deterministic", model: "fallback-v1", latencyMs: Date.now() - startedAt, status: "FAILED" } });
    throw error;
  }
}
