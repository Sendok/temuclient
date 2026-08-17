import Redis from "ioredis";

import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/observability/logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  return new Redis(getServerEnv().REDIS_URL, {
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function checkRedisConnection(): Promise<void> {
  if (redis.status === "wait") {
    await redis.connect();
  }

  await redis.ping();
}

export function redisKey(...parts: Array<string | number>) {
  return ["temuclient", "v1", getServerEnv().APP_ENV, ...parts].join(":");
}

export async function withRedis<T>(operation: () => Promise<T>, fallback: T, options: { failOpen?: boolean; operation: string }): Promise<T> {
  try { return await operation(); }
  catch (error) {
    logger.warn("redis_operation_failed", { operation: options.operation, error });
    if (options.failOpen ?? getServerEnv().RATE_LIMIT_FAIL_OPEN) return fallback;
    throw error;
  }
}
