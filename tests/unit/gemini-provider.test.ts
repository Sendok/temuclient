import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { GeminiProvider, type GeminiGenerateClient } from "../../src/modules/ai/providers/gemini";

describe("Gemini AI provider", () => {
  it("generates text and records Gemini token usage", async () => {
    const generateContent = vi.fn().mockResolvedValue({
      text: "Ringkasan opportunity",
      usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 7 },
    });
    const provider = new GeminiProvider("test-key", "gemini-test", {
      models: { generateContent },
    } satisfies GeminiGenerateClient);
    const onUsage = vi.fn();

    await expect(provider.generateText({ system: "system", prompt: "prompt", onUsage }))
      .resolves.toEqual({ text: "Ringkasan opportunity" });
    expect(generateContent).toHaveBeenCalledWith({
      model: "gemini-test",
      contents: "prompt",
      config: { systemInstruction: "system" },
    });
    expect(onUsage).toHaveBeenCalledWith({ inputTokens: 12, outputTokens: 7 });
  });

  it("requests JSON output and validates it with the domain Zod schema", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify({ score: 82 }) });
    const provider = new GeminiProvider("test-key", "gemini-test", {
      models: { generateContent },
    } satisfies GeminiGenerateClient);

    await expect(provider.generateObject({
      system: "system",
      prompt: "prompt",
      schemaName: "score",
      schema: z.object({ score: z.number().int().min(0).max(100) }),
      fallback: { score: 0 },
    })).resolves.toEqual({ score: 82 });
    expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({
        responseMimeType: "application/json",
        responseJsonSchema: expect.objectContaining({ type: "object" }),
      }),
    }));
  });

  it("rejects malformed structured output without using the fallback as provider output", async () => {
    const provider = new GeminiProvider("test-key", "gemini-test", {
      models: { generateContent: vi.fn().mockResolvedValue({ text: "not-json" }) },
    });

    await expect(provider.generateObject({
      system: "system",
      prompt: "prompt",
      schemaName: "score",
      schema: z.object({ score: z.number() }),
      fallback: { score: 0 },
    })).rejects.toMatchObject({ code: "AI_PROVIDER_UNAVAILABLE", status: 503 });
  });
});
