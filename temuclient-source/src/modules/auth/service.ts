import bcrypt from "bcryptjs";

import { AuthTokenPurpose, UserStatus } from "@/generated/prisma/enums";
import { DomainError } from "@/lib/errors/domain-error";
import type { LoginInput, RegisterInput } from "@/modules/auth/schema";
import { db } from "@/server/db/client";
import { createSession } from "@/server/auth/session";
import { createOpaqueToken, hashOpaqueToken } from "@/server/auth/tokens";

const PASSWORD_COST = 12;

export async function register(input: RegisterInput) {
  const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new DomainError("EMAIL_ALREADY_USED", "Email sudah terdaftar.", 409, { email: "Email sudah terdaftar." });

  const [passwordHash, verificationToken] = await Promise.all([
    bcrypt.hash(input.password, PASSWORD_COST),
    Promise.resolve(createOpaqueToken()),
  ]);
  const user = await db.$transaction(async (transaction) => {
    const created = await transaction.user.create({
      data: { name: input.name, email: input.email, credential: { create: { passwordHash } } },
    });
    await transaction.authToken.create({
      data: {
        userId: created.id,
        purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
        tokenHash: hashOpaqueToken(verificationToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    await transaction.analyticsEvent.create({ data: { name: "user_registered", userId: created.id } });
    return created;
  });
  const session = await createSession(user.id);
  return { user, session, verificationToken };
}

export async function login(input: LoginInput, audience: "MEMBER" | "PLATFORM" = "MEMBER") {
  const user = await db.user.findUnique({ where: { email: input.email }, include: { credential: true } });
  const validPassword = user?.credential ? await bcrypt.compare(input.password, user.credential.passwordHash) : false;
  if (!user || !validPassword) throw new DomainError("INVALID_CREDENTIALS", "Email atau password tidak valid.", 401);
  if (user.status !== UserStatus.ACTIVE) throw new DomainError("ACCOUNT_UNAVAILABLE", "Akun tidak dapat digunakan.", 403);
  if (audience === "PLATFORM" && !user.platformRole) throw new DomainError("ADMIN_ACCESS_REQUIRED", "Akun ini tidak memiliki akses admin TemuClient.", 403);
  if (audience === "MEMBER" && user.platformRole) throw new DomainError("USE_ADMIN_LOGIN", "Gunakan halaman masuk khusus admin.", 403);

  const membership = audience === "MEMBER" ? await db.organizationMember.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { joinedAt: "asc" },
  }) : null;
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const session = await createSession(user.id, membership?.organizationId);
  return { user, session };
}

export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return null;
  const token = createOpaqueToken();
  await db.$transaction([
    db.authToken.deleteMany({ where: { userId: user.id, purpose: AuthTokenPurpose.PASSWORD_RESET, usedAt: null } }),
    db.authToken.create({ data: { userId: user.id, purpose: AuthTokenPurpose.PASSWORD_RESET, tokenHash: hashOpaqueToken(token), expiresAt: new Date(Date.now() + 1000 * 60 * 30) } }),
  ]);
  return token;
}

export async function resetPassword(token: string, password: string) {
  const record = await db.authToken.findFirst({
    where: { tokenHash: hashOpaqueToken(token), purpose: AuthTokenPurpose.PASSWORD_RESET, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) throw new DomainError("RESET_TOKEN_INVALID", "Token reset tidak valid atau sudah kedaluwarsa.", 400);
  const passwordHash = await bcrypt.hash(password, PASSWORD_COST);
  await db.$transaction([
    db.userCredential.update({ where: { userId: record.userId }, data: { passwordHash } }),
    db.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
}

export async function verifyEmail(token: string) {
  const record = await db.authToken.findFirst({
    where: { tokenHash: hashOpaqueToken(token), purpose: AuthTokenPurpose.EMAIL_VERIFICATION, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) throw new DomainError("VERIFICATION_TOKEN_INVALID", "Token verifikasi tidak valid atau sudah kedaluwarsa.", 400);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    db.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}
