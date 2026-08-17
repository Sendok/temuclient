import { apiError, apiSuccess } from "@/lib/api-response";
import { getAuthorizedAttachment } from "@/modules/storage/permissions";
import { createPresignedStorageUrl } from "@/modules/storage/service";
import { requireUser } from "@/server/auth/authorization";
import { db } from "@/server/db/client";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, context] = await Promise.all([params, requireUser()]);
    const activeOrganizationId = context.session.activeOrganizationId;
    const membership = activeOrganizationId ? await db.organizationMember.findFirst({ where: { organizationId: activeOrganizationId, userId: context.user.id, status: "ACTIVE" }, select: { organizationId: true } }) : null;
    const attachment = await getAuthorizedAttachment(membership?.organizationId ?? null, Boolean(context.user.platformRole), id);
    return apiSuccess({ id: attachment.id, name: attachment.name, mimeType: attachment.mimeType, download: createPresignedStorageUrl("GET", attachment.storageKey, 300) });
  } catch (error) { return apiError(error); }
}
