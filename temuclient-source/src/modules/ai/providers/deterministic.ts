import type {
  AIProvider,
  GenerateObjectInput,
  GenerateTextInput,
} from "@/modules/ai/provider";

export class DeterministicAIProvider implements AIProvider {
  readonly name = "deterministic";
  readonly model = "contextual-fallback-v1";
  readonly mode = "fallback" as const;

  async generateText(input: GenerateTextInput) {
    return { text: input.prompt };
  }

  async generateObject<T>(input: GenerateObjectInput<T>) {
    return input.schema.parse(input.fallback);
  }
}
