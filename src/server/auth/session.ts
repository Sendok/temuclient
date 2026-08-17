import { cookies } from "next/headers";

import { db } from "@/server/db/client";
import { createOpaqueToken, hashOpaqueToken } from "@/server/auth/tokens";

export const SESSION_COOKIE_NAME = "temuclient_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export async function createSession(userId: string, activeOrganizationId?: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await db.session.create({
    data: { tokenHash: hashOpaqueToken(token), userId, activeOrganizationId, expiresAt },
  });
  return { session, token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return db.session.findFirst({
    where: { tokenHash: hashOpaqueToken(token), expiresAt: { gt: new Date() } },
    include: {
      user: true,
      activeOrganization: true,
    },
  });
}

export async function revokeCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashOpaqueToken(token) } });
  await clearSessionCookie();
}
