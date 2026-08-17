import type { OrganizationRole } from "@/generated/prisma/enums";

export function canReadProviderCapability(role: OrganizationRole): boolean {
  return ["OWNER", "ADMIN", "SALES", "MEMBER"].includes(role);
}

export function canManageProviderCapability(role: OrganizationRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}
