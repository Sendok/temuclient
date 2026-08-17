import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import type { AIProvider, AIUsage, GenerateObjectInput } from "@/modules/ai/provider";
import type { AISalesFeature } from "@/modules/ai/sales-schema";
import { db } from "@/server/db/client";

type ExecutionContext = {
  feature: AISalesFeature;
  organizationId: string;
  userId: string;
  entityType: "Opportunity" | "Meeting" | "Conversation" | "Deal";
  entityId: string;
};

export async function executeStructuredAI<T>(
  provider: AIProvider,
  context: ExecutionContext,
  input: Omit<GenerateObjectInput<T>, "onUsage">,
) {
  const startedAt = Date.now();
  let usage: AIUsage = {};
  try {
    const result = await provider.generateObject({
      ...input,
      onUsage: (value) => {
        usage = value;
      },
    });
    await writeExecution({
      ...context,
      provider: provider.name,
      model: provider.model,
      latencyMs: Date.now() - startedAt,
      status: "SUCCESS",
      ...usage,
    });
    return {
      ...result,
      assistance: {
        mode: provider.mode,
        provider: provider.name,
        model: provider.model,
        generatedAt: new Date().toISOString(),
        notice:
          provider.mode === "fallback"
            ? "Fallback kontekstual aktif. Tinjau dan sesuaikan sebelum digunakan."
            : "AI assistance berupa inferensi. Tinjau dan sesuaikan sebelum digunakan.",
      },
    };
  } catch (error) {
    await writeExecution({
      ...context,
      provider: provider.name,
      model: provider.model,
      latencyMs: Date.now() - startedAt,
      status: "FAILED",
      ...usage,
    });
    if (error instanceof DomainError) throw error;
    throw new DomainError(
      "AI_PROVIDER_UNAVAILABLE",
      "AI sedang tidak tersedia. Input Anda tetap ada di layar; silakan coba lagi.",
      503,
    );
  }
}

async function writeExecution(input: ExecutionContext & AIUsage & {
  provider: string;
  model: string;
  latencyMs: number;
  status: "SUCCESS" | "FAILED";
}) {
  await db.aIExecution.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      feature: input.feature,
      provider: input.provider,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      latencyMs: input.latencyMs,
      cost: input.cost,
      status: input.status,
      entityType: input.entityType,
      entityId: input.entityId,
    } satisfies Prisma.AIExecutionUncheckedCreateInput,
  });
}
