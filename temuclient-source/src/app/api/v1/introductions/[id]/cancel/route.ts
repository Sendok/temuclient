import { apiError, apiSuccess } from "@/lib/api-response";
import { cancelIntroduction } from "@/modules/introductions/service";
import { requireProviderSales } from "@/server/auth/authorization";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const [{ id }, context] = await Promise.all([params, requireProviderSales()]); return apiSuccess(await cancelIntroduction(context.organization.id, context.user.id, id)); }
  catch (error) { return apiError(error); }
}
