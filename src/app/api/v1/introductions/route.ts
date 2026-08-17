import { apiError, apiSuccess } from "@/lib/api-response";
import { introductionListQuerySchema } from "@/modules/introductions/schema";
import { listIntroductions } from "@/modules/introductions/service";
import { requireOrganization } from "@/server/auth/authorization";

export async function GET(request: Request) {
  try { const context = await requireOrganization(); const query = introductionListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams)); return apiSuccess(await listIntroductions(context.organization.id, context.organization.type, query)); }
  catch (error) { return apiError(error); }
}
