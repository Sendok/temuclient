import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("admin and organization-member login separation", async () => {
  const { db } = await import("../../src/server/db/client");
  const { login } = await import("../../src/modules/auth/service");
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const password = "ValidPass123";
  const ids: string[] = [];
  let adminEmail: string;
  let memberEmail: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 4);
    adminEmail = `separate-admin-${nonce}@example.test`;
    memberEmail = `separate-member-${nonce}@example.test`;
    const [admin, member] = await Promise.all([
      db.user.create({ data: { name: "Separated Admin", email: adminEmail, platformRole: "ADMIN", credential: { create: { passwordHash } } } }),
      db.user.create({ data: { name: "Separated Member", email: memberEmail, credential: { create: { passwordHash } } } }),
    ]);
    ids.push(admin.id, member.id);
  });

  afterAll(async () => {
    await db.session.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  });

  it("accepts a platform account only through the admin audience", async () => {
    await expect(login({ email: adminEmail, password })).rejects.toMatchObject({ code: "USE_ADMIN_LOGIN", status: 403 });
    const result = await login({ email: adminEmail, password }, "PLATFORM");
    expect(result.user.platformRole).toBe("ADMIN");
    expect(result.session.session.activeOrganizationId).toBeNull();
  });

  it("rejects a normal member from the platform audience", async () => {
    await expect(login({ email: memberEmail, password }, "PLATFORM")).rejects.toMatchObject({ code: "ADMIN_ACCESS_REQUIRED", status: 403 });
    const result = await login({ email: memberEmail, password });
    expect(result.user.platformRole).toBeNull();
  });
});
