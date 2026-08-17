import { DomainError } from "@/lib/errors/domain-error";
import type { AIProvider } from "@/modules/ai/provider";
import { DeterministicAIProvider } from "@/modules/ai/providers/deterministic";
import { OpenAIProvider } from "@/modules/ai/providers/openai";

export function getAIProvider(source: NodeJS.ProcessEnv = process.env): AIProvider {
  const provider = source.AI_PROVIDER?.trim().toLowerCase() || "deterministic";
  if (provider === "deterministic") return new DeterministicAIProvider();
  if (provider === "openai") {
    if (!source.OPENAI_API_KEY)
      return new UnavailableAIProvider("openai", source.OPENAI_MODEL || "not-configured");
    return new OpenAIProvider(
      source.OPENAI_API_KEY,
      source.OPENAI_MODEL || "gpt-5.6-luna",
    );
  }
  return new UnavailableAIProvider(provider, "unsupported");
}

class UnavailableAIProvider implements AIProvider {
  readonly mode = "provider" as const;

  constructor(
    readonly name: string,
    readonly model: string,
  ) {}

  async generateText(): Promise<never> {
    throw this.error();
  }

  async generateObject<T>(): Promise<T> {
    throw this.error();
  }

  private error() {
    return new DomainError(
      "AI_PROVIDER_UNAVAILABLE",
      "Provider AI belum dikonfigurasi atau tidak didukung. Input Anda tetap ada; hubungi administrator atau coba lagi nanti.",
      503,
    );
  }
}
