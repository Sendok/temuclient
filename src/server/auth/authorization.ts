import type {
  OrganizationRole,
  OrganizationType,
} from "@/generated/prisma/enums";
import { DomainError } from "@/lib/errors/domain-error";
import {
  hasOrganizationRole,
  isOrganizationType,
} from "@/lib/permissions/organization";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { assertOrganizationCanMutate, assertPlatformRole } from "@/modules/admin/permissions";
import type { PlatformRole } from "@/generated/prisma/enums";

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session)
    throw new DomainError(
      "UNAUTHENTICATED",
      "Silakan masuk untuk melanjutkan.",
      401,
    );
  return { session, user: session.user };
}

export async function getOrganizationContextForUser(
  userId: string,
  organizationId: string,
) {
  const membership = await db.organizationMember.findFirst({
    where: { organizationId, userId, status: "ACTIVE" },
    include: { organization: true },
  });
  if (!membership)
    throw new DomainError(
      "FORBIDDEN",
      "Anda tidak memiliki akses ke organisasi ini.",
      403,
    );
  return { membership, organization: membership.organization };
}

export async function requireOrganization(organizationId?: string) {
  const { session, user } = await requireUser();
  const targetId = organizationId ?? session.activeOrganizationId;
  if (!targetId)
    throw new DomainError(
      "ORGANIZATION_REQUIRED",
      "Selesaikan onboarding perusahaan.",
      403,
    );
  const context = await getOrganizationContextForUser(user.id, targetId);
  return { session, user, ...context };
}

export async function requireMutableOrganization(organizationId?: string) {
  const context = await requireOrganization(organizationId);
  assertOrganizationCanMutate(context.organization.status);
  return context;
}

export async function requireOrganizationRole(
  allowed: readonly OrganizationRole[],
  organizationId?: string,
) {
  const context = await requireOrganization(organizationId);
  if (!hasOrganizationRole(context.membership.role, allowed)) {
    throw new DomainError(
      "FORBIDDEN",
      "Role Anda tidak memiliki izin untuk tindakan ini.",
      403,
    );
  }
  assertOrganizationCanMutate(context.organization.status);
  return context;
}

export async function requireMutableOrganizationRole(
  allowed: readonly OrganizationRole[],
  organizationId?: string,
) {
  const context = await requireOrganizationRole(allowed, organizationId);
  assertOrganizationCanMutate(context.organization.status);
  return context;
}

export async function requirePlatformRole(
  allowed?: readonly PlatformRole[],
) {
  const context = await requireUser();
  assertPlatformRole(context.user.platformRole, allowed);
  return context;
}

export async function requireOrganizationType(
  type: OrganizationType,
  organizationId?: string,
) {
  const context = await requireOrganization(organizationId);
  if (!isOrganizationType(context.organization.type, type)) {
    throw new DomainError(
      "FORBIDDEN",
      `Halaman ini hanya tersedia untuk organisasi ${type.toLowerCase()}.`,
      403,
    );
  }
  return context;
}

export async function requireProviderOrganization(organizationId?: string) {
  return requireOrganizationType("PROVIDER", organizationId);
}

export async function requireMutableProviderOrganization(organizationId?: string) {
  const context = await requireProviderOrganization(organizationId);
  assertOrganizationCanMutate(context.organization.status);
  return context;
}

export async function requireProviderManager(organizationId?: string) {
  const context = await requireOrganizationRole(
    ["OWNER", "ADMIN"],
    organizationId,
  );
  if (!isOrganizationType(context.organization.type, "PROVIDER"))
    throw new DomainError(
      "FORBIDDEN",
      "Tindakan ini hanya tersedia untuk organisasi Provider.",
      403,
    );
  return context;
}

export async function requireMutableProviderManager(organizationId?: string) {
  const context = await requireProviderManager(organizationId);
  assertOrganizationCanMutate(context.organization.status);
  return context;
}

export async function requireProviderSales(organizationId?: string) {
  const context = await requireOrganizationRole(
    ["OWNER", "ADMIN", "SALES"],
    organizationId,
  );
  if (!isOrganizationType(context.organization.type, "PROVIDER"))
    throw new DomainError(
      "FORBIDDEN",
      "Tindakan ini hanya tersedia untuk organisasi Provider.",
      403,
    );
  return context;
}

export async function requireMutableProviderSales(organizationId?: string) {
  const context = await requireProviderSales(organizationId);
  assertOrganizationCanMutate(context.organization.status);
  return context;
}

export async function requireBuyerOrganization(organizationId?: string) {
  return requireOrganizationType("BUYER", organizationId);
}

export async function requireBuyerManager(organizationId?: string) {
  const context = await requireOrganizationRole(
    ["OWNER", "ADMIN"],
    organizationId,
  );
  if (!isOrganizationType(context.organization.type, "BUYER"))
    throw new DomainError(
      "FORBIDDEN",
      "Tindakan ini hanya tersedia untuk organisasi Buyer.",
      403,
    );
  return context;
}

export async function requireMutableBuyerManager(organizationId?: string) {
  const context = await requireBuyerManager(organizationId);
  assertOrganizationCanMutate(context.organization.status);
  return context;
}
