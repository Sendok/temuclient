import { apiError, apiSuccess } from "@/lib/api-response";
import { getIntroduction } from "@/modules/introductions/service";
import { requireOrganization } from "@/server/auth/authorization";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const [{ id }, context] = await Promise.all([params, requireOrganization()]); return apiSuccess(await getIntroduction(context.organization.id, id)); }
  catch (error) { return apiError(error); }
}
