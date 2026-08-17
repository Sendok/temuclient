import { apiError, apiSuccess } from "@/lib/api-response";
import { changeDealStageSchema } from "@/modules/deals/schema";
import { changeDealStage } from "@/modules/deals/service";
import { requireMutableProviderOrganization } from "@/server/auth/authorization";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, context, body] = await Promise.all([
      params,
      requireMutableProviderOrganization(),
      request.json(),
    ]);
    const input = changeDealStageSchema.parse(body);
    return apiSuccess(
      await changeDealStage(
        context.organization.id,
        context.user.id,
        context.membership.role,
        id,
        input.stage,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
