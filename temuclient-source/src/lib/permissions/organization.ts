import type { OrganizationRole, OrganizationType } from "@/generated/prisma/enums";

const roleRank: Record<OrganizationRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  SALES: 2,
  MEMBER: 1,
};

export function hasOrganizationRole(current: OrganizationRole, allowed: readonly OrganizationRole[]): boolean {
  return allowed.includes(current);
}

export function hasMinimumOrganizationRole(current: OrganizationRole, minimum: OrganizationRole): boolean {
  return roleRank[current] >= roleRank[minimum];
}

export function isOrganizationType(current: OrganizationType, required: OrganizationType): boolean {
  return current === required || current === "HYBRID";
}
