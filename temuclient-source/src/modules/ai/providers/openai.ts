import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { DomainError } from "@/lib/errors/domain-error";
import type {
  AIProvider,
  GenerateObjectInput,
  GenerateTextInput,
} from "@/modules/ai/provider";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly mode = "provider" as const;
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async generateText(input: GenerateTextInput) {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: input.system,
      input: input.prompt,
      store: false,
    });
    input.onUsage?.({
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    });
    if (!response.output_text)
      throw new DomainError(
        "AI_PROVIDER_UNAVAILABLE",
        "AI belum menghasilkan respons. Input Anda tetap tersimpan di layar; silakan coba lagi.",
        503,
      );
    return { text: response.output_text };
  }

  async generateObject<T>(input: GenerateObjectInput<T>) {
    const response = await this.client.responses.parse({
      model: this.model,
      instructions: input.system,
      input: input.prompt,
      store: false,
      text: { format: zodTextFormat(input.schema, input.schemaName) },
    });
    input.onUsage?.({
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    });
    if (!response.output_parsed)
      throw new DomainError(
        "AI_PROVIDER_UNAVAILABLE",
        "AI belum menghasilkan output yang valid. Input Anda tetap tersimpan di layar; silakan coba lagi.",
        503,
      );
    return input.schema.parse(response.output_parsed);
  }
}
