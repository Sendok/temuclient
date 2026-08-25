import { DomainError } from "@/lib/errors/domain-error";
import { redis, redisKey, withRedis } from "@/server/redis/client";

export async function enforceAuthRateLimit(request: Request, scope: string, limit: number, windowSeconds: number) {
  return enforceFeatureRateLimit(request, `auth:${scope}`, limit, windowSeconds);
}

export async function enforceFeatureRateLimit(request: Request, scope: string, limit: number, windowSeconds: number) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = redisKey("rate-limit", scope, address);
  const count = await withRedis(async () => { const next = await redis.incr(key); if (next === 1) await redis.expire(key, windowSeconds); return next; }, 0, { operation: `rate_limit:${scope}` });
  if (count > limit) throw new DomainError("RATE_LIMITED", "Terlalu banyak percobaan. Silakan coba kembali nanti.", 429);
}

export type AIPlan = "FREE" | "PRO" | "BUSINESS";

const aiPlanLimits: Record<AIPlan, number> = {
  FREE: 10,
  PRO: 50,
  BUSINESS: 200,
};

export async function enforceAIRateLimit(input: {
  userId: string;
  organizationId: string;
  feature: string;
  plan?: AIPlan;
  windowSeconds?: number;
}) {
  const plan = input.plan ?? "FREE";
  const windowSeconds = input.windowSeconds ?? 3600;
  const key = redisKey("rate-limit", "ai", plan, input.organizationId, input.userId, input.feature);
  const count = await withRedis(async () => { const next = await redis.incr(key); if (next === 1) await redis.expire(key, windowSeconds); return next; }, 0, { operation: "rate_limit:ai" });
  if (count > aiPlanLimits[plan])
    throw new DomainError(
      "AI_RATE_LIMITED",
      "Batas penggunaan AI untuk periode ini telah tercapai. Coba kembali nanti.",
      429,
    );
  return { remaining: Math.max(0, aiPlanLimits[plan] - count), limit: aiPlanLimits[plan] };
}
