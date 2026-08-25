import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";

const input = z.object({
  DATABASE_URL: z.string().url().refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://")),
  BOOTSTRAP_ADMIN_EMAIL: z.email().transform((value) => value.trim().toLowerCase()),
  BOOTSTRAP_ADMIN_NAME: z.string().trim().min(2).max(100).default("TemuClient Administrator"),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).max(128)
    .regex(/[A-Z]/, "Password requires an uppercase letter.")
    .regex(/[a-z]/, "Password requires a lowercase letter.")
    .regex(/[0-9]/, "Password requires a number.")
    .regex(/[^A-Za-z0-9]/, "Password requires a symbol."),
}).parse(process.env);

const db = new PrismaClient({ adapter: new PrismaPg(input.DATABASE_URL) });

async function main() {
  const existingAdmin = await db.user.findFirst({
    where: { platformRole: { not: null } },
    select: { id: true, email: true, platformRole: true },
  });

  if (existingAdmin) {
    if (existingAdmin.email === input.BOOTSTRAP_ADMIN_EMAIL && existingAdmin.platformRole === "SUPER_ADMIN") {
      console.info(JSON.stringify({ status: "already_bootstrapped", adminId: existingAdmin.id }));
      return;
    }
    throw new Error("A platform administrator already exists; bootstrap refused.");
  }

  if (await db.user.findUnique({ where: { email: input.BOOTSTRAP_ADMIN_EMAIL }, select: { id: true } })) {
    throw new Error("Bootstrap email already belongs to a non-platform user; bootstrap refused.");
  }

  const passwordHash = await bcrypt.hash(input.BOOTSTRAP_ADMIN_PASSWORD, 12);
  const admin = await db.$transaction(async (transaction) => {
    const created = await transaction.user.create({ data: {
      name: input.BOOTSTRAP_ADMIN_NAME,
      email: input.BOOTSTRAP_ADMIN_EMAIL,
      emailVerifiedAt: new Date(),
      platformRole: "SUPER_ADMIN",
      credential: { create: { passwordHash } },
    } });
    await transaction.auditLog.create({ data: {
      actorUserId: created.id,
      action: "PLATFORM_ADMIN_BOOTSTRAPPED",
      entityType: "User",
      entityId: created.id,
      afterJson: { email: created.email, platformRole: created.platformRole },
      metadataJson: { source: "controlled_cloud_run_job" },
      userAgent: "temuclient-admin-bootstrap-job",
    } });
    return created;
  }, { isolationLevel: "Serializable" });

  console.info(JSON.stringify({ status: "bootstrapped", adminId: admin.id }));
}

await main().finally(() => db.$disconnect());

