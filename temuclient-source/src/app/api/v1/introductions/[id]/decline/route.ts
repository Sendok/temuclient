import { apiError, apiSuccess } from "@/lib/api-response";
import { declineIntroductionSchema } from "@/modules/introductions/schema";
import { declineIntroduction } from "@/modules/introductions/service";
import { requireBuyerManager } from "@/server/auth/authorization";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const [{ id }, context, body] = await Promise.all([params, requireBuyerManager(), request.json().catch(() => ({}))]); const input = declineIntroductionSchema.parse(body); return apiSuccess(await declineIntroduction(context.organization.id, context.user.id, id, input.reason)); }
  catch (error) { return apiError(error); }
}
