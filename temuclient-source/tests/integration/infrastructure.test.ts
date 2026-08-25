import { afterAll, describe, expect, it } from "vitest";

const runInfrastructureTests = process.env.RUN_INFRASTRUCTURE_TESTS === "true";

describe.skipIf(!runInfrastructureTests)("local infrastructure", () => {
  afterAll(async () => {
    const [{ db }, { redis }] = await Promise.all([
      import("../../src/server/db/client"),
      import("../../src/server/redis/client"),
    ]);

    redis.disconnect();
    await db.$disconnect();
  });

  it("connects to PostgreSQL and Redis", async () => {
    const [{ checkDatabaseConnection }, { checkRedisConnection }] = await Promise.all([
      import("../../src/server/db/client"),
      import("../../src/server/redis/client"),
    ]);

    await expect(checkDatabaseConnection()).resolves.toBeUndefined();
    await expect(checkRedisConnection()).resolves.toBeUndefined();
  });
});
