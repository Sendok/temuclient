import { randomUUID } from "node:crypto";

import { OrganizationRole } from "@/generated/prisma/enums";
import type { CreateOrganizationInput, InviteOrganizationMemberInput, UpdateOrganizationInput } from "@/modules/organizations/schema";
import { db } from "@/server/db/client";
import { assertTeamSeatAvailable } from "@/modules/entitlements/access";
import { DomainError } from "@/lib/errors/domain-error";

function slugify(value: string): string {
  const base = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base || "organization"}-${randomUUID().slice(0, 8)}`;
}

export async function createOrganizationWithOwner(userId: string, sessionId: string, input: CreateOrganizationInput) {
  return db.$transaction(async (transaction) => {
    const organization = await transaction.organization.create({
      data: {
        name: input.name,
        slug: slugify(input.name),
        type: input.type,
        website: input.website,
        city: input.city,
        description: input.description,
        businessEmail: input.businessEmail,
      },
    });
    const membership = await transaction.organizationMember.create({
      data: { organizationId: organization.id, userId, role: OrganizationRole.OWNER, status: "ACTIVE" },
    });
    await transaction.subscription.create({ data: { organizationId: organization.id, plan: "FREE", status: "ACTIVE", provider: "sandbox" } });
    await transaction.analyticsEvent.create({ data: { name: "role_selected", userId, organizationId: organization.id, entityType: "Organization", entityId: organization.id, propertiesJson: { role: organization.type } } });
    await transaction.analyticsEvent.create({ data: { name: "organization_created", userId, organizationId: organization.id, entityType: "Organization", entityId: organization.id, propertiesJson: { type: organization.type } } });
    await transaction.session.update({ where: { id: sessionId }, data: { activeOrganizationId: organization.id } });
    return { organization, membership };
  });
}

export async function updateOrganization(organizationId: string, input: UpdateOrganizationInput) {
  return db.organization.update({ where: { id: organizationId }, data: input });
}

export async function inviteOrganizationMember(organizationId: string, actorUserId: string, input: InviteOrganizationMemberInput) {
  await assertTeamSeatAvailable(organizationId);
  return db.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (!user) throw new DomainError("MEMBER_ACCOUNT_REQUIRED", "Pengguna perlu membuat akun TemuClient sebelum dapat ditambahkan.", 409);
    const existing = await transaction.organizationMember.findUnique({ where: { organizationId_userId: { organizationId, userId: user.id } } });
    if (existing && existing.status !== "REMOVED") throw new DomainError("MEMBER_ALREADY_EXISTS", "Pengguna sudah menjadi anggota organisasi.", 409);
    const member = await transaction.organizationMember.upsert({
      where: { organizationId_userId: { organizationId, userId: user.id } },
      update: { role: input.role, status: "INVITED" },
      create: { organizationId, userId: user.id, role: input.role, status: "INVITED" },
    });
    await transaction.auditLog.create({ data: { actorUserId, actorOrganizationId: organizationId, action: "ORGANIZATION_MEMBER_INVITED", entityType: "OrganizationMember", entityId: member.id, afterJson: { role: member.role, status: member.status } } });
    return member;
  });
}
