import { apiError, apiSuccess } from "@/lib/api-response";
import { providerFeedQuerySchema } from "@/modules/matching/schema";
import { listProviderOpportunityFeed } from "@/modules/matching/service";
import { requireProviderOrganization } from "@/server/auth/authorization";

export async function GET(request: Request) {
  try {
    const context = await requireProviderOrganization();
    const raw = Object.fromEntries(new URL(request.url).searchParams);
    const query = providerFeedQuerySchema.parse({ ...raw, minScore: raw.matchMin ?? raw.minScore, limit: raw.pageSize ?? raw.limit });
    return apiSuccess(await listProviderOpportunityFeed(context.organization.id, query));
  } catch (error) { return apiError(error); }
}
