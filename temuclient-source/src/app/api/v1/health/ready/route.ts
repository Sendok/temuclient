import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/server/db/client";
import { checkRedisConnection } from "@/server/redis/client";

export const dynamic = "force-dynamic";
export async function GET() {
  const started = performance.now();
  const [database, redis] = await Promise.allSettled([checkDatabaseConnection(), checkRedisConnection()]);
  const ready = database.status === "fulfilled" && redis.status === "fulfilled";
  return NextResponse.json({ data: { status: ready ? "ready" : "not_ready", checks: { database: database.status === "fulfilled" ? "ok" : "failed", redis: redis.status === "fulfilled" ? "ok" : "failed" } }, meta: {} }, { status: ready ? 200 : 503, headers: { "server-timing": `readiness;dur=${(performance.now() - started).toFixed(1)}`, "cache-control": "no-store" } });
}
