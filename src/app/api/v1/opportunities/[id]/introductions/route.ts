import { apiError, apiSuccess } from "@/lib/api-response";
import { requestIntroductionSchema } from "@/modules/introductions/schema";
import { requestIntroduction } from "@/modules/introductions/service";
import { requireProviderSales } from "@/server/auth/authorization";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const [{ id }, context, body] = await Promise.all([params, requireProviderSales(), request.json()]); const input = requestIntroductionSchema.parse(body); return apiSuccess(await requestIntroduction(context.organization.id, context.user.id, id, input), { status: 201 }); }
  catch (error) { return apiError(error); }
}
