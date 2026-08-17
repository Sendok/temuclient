import { apiSuccess } from "@/lib/api-response";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return apiSuccess({ user: null, activeOrganization: null, memberships: [] });
  const memberships = await db.organizationMember.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    include: { organization: true },
  });
  return apiSuccess({
    user: { id: session.user.id, name: session.user.name, email: session.user.email, platformRole: session.user.platformRole },
    activeOrganization: session.activeOrganization,
    memberships: memberships.map((item) => ({ id: item.id, role: item.role, organization: item.organization })),
  });
}
