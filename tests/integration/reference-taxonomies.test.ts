import { afterAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("production reference taxonomy catalog", async () => {
  const { db } = await import("../../src/server/db/client");

  afterAll(async () => db.$disconnect());

  it("installs the choices required by Buyer and Provider onboarding", async () => {
    const [services, industries, technologies] = await Promise.all([
      db.serviceCategory.findMany({ where: { isActive: true }, select: { slug: true, description: true } }),
      db.industry.findMany({ where: { isActive: true }, select: { slug: true } }),
      db.technology.findMany({ select: { slug: true } }),
    ]);

    expect(services.length).toBeGreaterThanOrEqual(15);
    expect(services.every((service) => Boolean(service.description))).toBe(true);
    expect(services.map((service) => service.slug)).toEqual(expect.arrayContaining([
      "custom-software-development",
      "ai-development",
      "cybersecurity",
      "system-integration",
    ]));
    expect(industries.length).toBeGreaterThanOrEqual(15);
    expect(technologies.length).toBeGreaterThanOrEqual(15);
  });
});
