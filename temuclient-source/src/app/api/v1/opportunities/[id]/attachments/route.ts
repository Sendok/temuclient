import { apiError, apiSuccess } from "@/lib/api-response";
import { attachmentMetadataSchema } from "@/modules/opportunities/schema";
import { addAttachmentMetadata } from "@/modules/opportunities/service";
import { requireBuyerManager } from "@/server/auth/authorization";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireBuyerManager()]); const input = attachmentMetadataSchema.parse(await request.json()); return apiSuccess(await addAttachmentMetadata(context.organization.id, context.user.id, id, input), { status: 201 }); } catch (error) { return apiError(error); } }
