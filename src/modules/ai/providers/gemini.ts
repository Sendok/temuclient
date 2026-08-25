import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { DomainError } from "@/lib/errors/domain-error";
import type {
  AIProvider,
  GenerateObjectInput,
  GenerateTextInput,
} from "@/modules/ai/provider";

type GeminiResponse = {
  text?: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
};

export type GeminiGenerateClient = {
  models: {
    generateContent(input: {
      model: string;
      contents: string;
      config: {
        systemInstruction: string;
        responseMimeType?: string;
        responseJsonSchema?: unknown;
      };
    }): Promise<GeminiResponse>;
  };
};

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  readonly mode = "provider" as const;
  private readonly client: GeminiGenerateClient;

  constructor(
    apiKey: string,
    readonly model: string,
    client?: GeminiGenerateClient,
  ) {
    this.client = client ?? new GoogleGenAI({ apiKey });
  }

  async generateText(input: GenerateTextInput) {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: input.prompt,
      config: { systemInstruction: input.system },
    });
    this.reportUsage(response, input.onUsage);
    if (!response.text)
      throw new DomainError(
        "AI_PROVIDER_UNAVAILABLE",
        "Gemini belum menghasilkan respons. Input Anda tetap ada di layar; silakan coba lagi.",
        503,
      );
    return { text: response.text };
  }

  async generateObject<T>(input: GenerateObjectInput<T>) {
    const responseJsonSchema = Object.fromEntries(
      Object.entries(z.toJSONSchema(input.schema)).filter(([key]) => key !== "$schema"),
    );
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: input.prompt,
      config: {
        systemInstruction: input.system,
        responseMimeType: "application/json",
        responseJsonSchema,
      },
    });
    this.reportUsage(response, input.onUsage);
    if (!response.text)
      throw new DomainError(
        "AI_PROVIDER_UNAVAILABLE",
        "Gemini belum menghasilkan output yang valid. Input Anda tetap ada di layar; silakan coba lagi.",
        503,
      );
    try {
      return input.schema.parse(JSON.parse(response.text));
    } catch {
      throw new DomainError(
        "AI_PROVIDER_UNAVAILABLE",
        "Gemini menghasilkan format yang tidak valid. Input Anda tetap ada di layar; silakan coba lagi.",
        503,
      );
    }
  }

  private reportUsage(response: GeminiResponse, callback: GenerateTextInput["onUsage"]) {
    callback?.({
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    });
  }
}
