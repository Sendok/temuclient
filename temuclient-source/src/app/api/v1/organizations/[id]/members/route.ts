import { apiError, apiSuccess } from "@/lib/api-response";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { db } from "@/server/db/client";
import { inviteOrganizationMemberSchema } from "@/modules/organizations/schema";
import { inviteOrganizationMember } from "@/modules/organizations/service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireOrganizationRole(["OWNER", "ADMIN"], id);
    const members = await db.organizationMember.findMany({
      where: { organizationId: id, status: { not: "REMOVED" } },
      include: { user: { select: { id: true, name: true, email: true, status: true } } },
      orderBy: { joinedAt: "asc" },
    });
    return apiSuccess(members);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const context = await requireOrganizationRole(["OWNER", "ADMIN"], id);
    const input = inviteOrganizationMemberSchema.parse(await request.json());
    return apiSuccess(await inviteOrganizationMember(id, context.user.id, input), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
