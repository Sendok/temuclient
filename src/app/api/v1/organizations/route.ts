import { apiError, apiSuccess } from "@/lib/api-response";
import { DomainError } from "@/lib/errors/domain-error";
import { createOrganizationSchema } from "@/modules/organizations/schema";
import { createOrganizationWithOwner } from "@/modules/organizations/service";
import { requireUser } from "@/server/auth/authorization";
import { db } from "@/server/db/client";

export async function POST(request: Request) {
  try {
    const { user, session } = await requireUser();
    const existingMembership = await db.organizationMember.findFirst({ where: { userId: user.id, status: "ACTIVE" } });
    if (existingMembership) throw new DomainError("ORGANIZATION_ALREADY_EXISTS", "Akun sudah memiliki organisasi aktif.", 409);
    const input = createOrganizationSchema.parse(await request.json());
    const result = await createOrganizationWithOwner(user.id, session.id, input);
    return apiSuccess(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
