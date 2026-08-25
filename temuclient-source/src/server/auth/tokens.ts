import { createHmac, randomBytes } from "node:crypto";

import { getServerEnv } from "@/lib/env";

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHmac("sha256", getServerEnv().AUTH_SECRET).update(token).digest("hex");
}
