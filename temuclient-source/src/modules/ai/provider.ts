import type { z } from "zod";

export type AIUsage = {
  inputTokens?: number;
  outputTokens?: number;
  cost?: string;
};

export type GenerateTextInput = {
  system: string;
  prompt: string;
  onUsage?: (usage: AIUsage) => void;
};

export type GenerateTextResult = {
  text: string;
};

export type GenerateObjectInput<T> = {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
  fallback: T;
  onUsage?: (usage: AIUsage) => void;
};

export type EmbedInput = { values: string[] };
export type EmbedResult = { vectors: number[][] };

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  readonly mode: "provider" | "fallback";
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
  generateObject<T>(input: GenerateObjectInput<T>): Promise<T>;
  embed?(input: EmbedInput): Promise<EmbedResult>;
}
