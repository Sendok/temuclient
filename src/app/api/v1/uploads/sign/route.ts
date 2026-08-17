import { apiError, apiSuccess } from "@/lib/api-response";
import { DomainError } from "@/lib/errors/domain-error";
import { uploadSignSchema } from "@/modules/storage/schema";
import { createPresignedUpload, createStorageKey } from "@/modules/storage/service";
import { requireMutableOrganizationRole } from "@/server/auth/authorization";
import { db } from "@/server/db/client";

export async function POST(request: Request) {
  try {
    const context = await requireMutableOrganizationRole(["OWNER", "ADMIN"]);
    const input = uploadSignSchema.parse(await request.json());
    if (input.category === "OPPORTUNITY_ATTACHMENT") {
      const opportunity = await db.opportunity.findFirst({ where: { id: input.entityId, buyerOrganizationId: context.organization.id, status: { in: ["DRAFT", "REVIEW"] } }, select: { id: true } });
      if (!opportunity) throw new DomainError("NOT_FOUND", "Draft Opportunity tidak ditemukan.", 404);
    }
    const storageKey = createStorageKey(context.organization.id, input);
    return apiSuccess({ storageKey, upload: createPresignedUpload(storageKey, input.mimeType, input.size), requiredContentType: input.mimeType, maximumSize: input.size });
  } catch (error) { return apiError(error); }
}
