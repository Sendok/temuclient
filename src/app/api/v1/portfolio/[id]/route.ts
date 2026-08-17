import { apiError, apiSuccess } from "@/lib/api-response";
import { updatePortfolioSchema } from "@/modules/portfolio/schema";
import { deletePortfolio, getPortfolio, updatePortfolio } from "@/modules/portfolio/service";
import { requireProviderManager, requireProviderOrganization } from "@/server/auth/authorization";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireProviderOrganization()]); return apiSuccess(await getPortfolio(context.organization.id, id)); } catch (error) { return apiError(error); } }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireProviderManager()]); const input = updatePortfolioSchema.parse(await request.json()); return apiSuccess(await updatePortfolio(context.organization.id, id, input)); } catch (error) { return apiError(error); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const [{ id }, context] = await Promise.all([params, requireProviderManager()]); await deletePortfolio(context.organization.id, id); return apiSuccess({ deleted: true }); } catch (error) { return apiError(error); } }
