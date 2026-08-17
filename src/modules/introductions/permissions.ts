import type { OrganizationRole } from "@/generated/prisma/enums";

export const canRequestIntroduction = (role: OrganizationRole) =>
  ["OWNER", "ADMIN", "SALES"].includes(role);
export const canRespondToIntroduction = (role: OrganizationRole) =>
  ["OWNER", "ADMIN"].includes(role);
export const canCancelIntroduction = (role: OrganizationRole) =>
  ["OWNER", "ADMIN", "SALES"].includes(role);
