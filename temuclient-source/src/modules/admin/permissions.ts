import type { PlatformRole } from "@/generated/prisma/enums";
import { DomainError } from "@/lib/errors/domain-error";

export const PLATFORM_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR"] as const satisfies readonly PlatformRole[];

export function canModerate(role: PlatformRole | null): boolean {
  return role !== null && PLATFORM_ADMIN_ROLES.includes(role);
}

export function canSuspendOrganization(role: PlatformRole | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function assertPlatformRole(
  role: PlatformRole | null,
  allowed: readonly PlatformRole[] = PLATFORM_ADMIN_ROLES,
) {
  if (!role || !allowed.includes(role)) {
    throw new DomainError("FORBIDDEN", "Akses ini hanya tersedia untuk tim platform TemuClient.", 403);
  }
}

export function assertOrganizationCanMutate(status: string) {
  if (status !== "ACTIVE") {
    throw new DomainError(
      "ORGANIZATION_SUSPENDED",
      "Organisasi sedang ditangguhkan dan tidak dapat membuat perubahan komersial baru.",
      403,
    );
  }
}
