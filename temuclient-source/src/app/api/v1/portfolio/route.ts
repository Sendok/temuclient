import { apiError, apiSuccess } from "@/lib/api-response";
import { createPortfolioSchema } from "@/modules/portfolio/schema";
import { createPortfolio, listPortfolios } from "@/modules/portfolio/service";
import { requireProviderManager, requireProviderOrganization } from "@/server/auth/authorization";

export async function GET() { try { const context = await requireProviderOrganization(); return apiSuccess(await listPortfolios(context.organization.id)); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { const context = await requireProviderManager(); const input = createPortfolioSchema.parse(await request.json()); return apiSuccess(await createPortfolio(context.organization.id, input), { status: 201 }); } catch (error) { return apiError(error); } }
