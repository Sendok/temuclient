import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@/server/db/client";
import { checkRedisConnection } from "@/server/redis/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const [database, redis] = await Promise.allSettled([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);
  const isHealthy = database.status === "fulfilled" && redis.status === "fulfilled";

  return NextResponse.json(
    {
      data: {
        status: isHealthy ? "ok" : "degraded",
        services: {
          database: database.status === "fulfilled" ? "connected" : "unavailable",
          redis: redis.status === "fulfilled" ? "connected" : "unavailable",
        },
      },
      meta: {},
    },
    { status: isHealthy ? 200 : 503 },
  );
}
