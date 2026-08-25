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

let redisReadyPromise: Promise<void> | undefined;

async function waitForRedisReady(): Promise<void> {
  if (redis.status === "ready") return;

  redisReadyPromise ??= (async () => {
    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
      return;
    }

    await new Promise<void>((resolve, reject) => {
      let lastError: Error | undefined;
      const timeout = setTimeout(() => finish(lastError ?? new Error("Redis connection timed out.")), 5_000);
      const onReady = () => finish();
      const onError = (error: Error) => { lastError = error; };
      const onEnd = () => finish(lastError ?? new Error("Redis connection ended before becoming ready."));
      const cleanup = () => {
        clearTimeout(timeout);
        redis.off("ready", onReady);
        redis.off("error", onError);
        redis.off("end", onEnd);
      };
      const finish = (error?: Error) => {
        cleanup();
        if (error) reject(error);
        else resolve();
      };

      redis.on("error", onError);
      redis.once("ready", onReady);
      redis.once("end", onEnd);
      if (redis.status === "ready") finish();
    });
  })().finally(() => { redisReadyPromise = undefined; });

  await redisReadyPromise;
}

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function checkRedisConnection(): Promise<void> {
  await waitForRedisReady();
  await redis.ping();
}

export function redisKey(...parts: Array<string | number>) {
  return ["temuclient", "v1", getServerEnv().APP_ENV, ...parts].join(":");
}

export async function withRedis<T>(operation: () => Promise<T>, fallback: T, options: { failOpen?: boolean; operation: string }): Promise<T> {
  try {
    await waitForRedisReady();
    return await operation();
  }
  catch (error) {
    logger.warn("redis_operation_failed", { operation: options.operation, error });
    if (options.failOpen ?? getServerEnv().RATE_LIMIT_FAIL_OPEN) return fallback;
    throw error;
  }
}
