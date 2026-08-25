import type { OrganizationRole } from "@/generated/prisma/enums";

export function canReadDeal(
  providerOrganizationId: string,
  organizationId: string,
) {
  return providerOrganizationId === organizationId;
}

export function canManageDeal(
  role: OrganizationRole,
  userId: string,
  ownerUserId: string,
) {
  return (
    role === "OWNER" ||
    role === "ADMIN" ||
    (role === "SALES" && userId === ownerUserId)
  );
}

export function canCreateDeal(role: OrganizationRole) {
  return ["OWNER", "ADMIN", "SALES"].includes(role);
}
