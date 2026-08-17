import { apiError, apiList } from "@/lib/api-response";
import { adminListQuerySchema } from "@/modules/admin/schema";
import { listAdminOrganizations } from "@/modules/admin/service";
import { requirePlatformRole } from "@/server/auth/authorization";

export async function GET(request: Request) { try { await requirePlatformRole(); const query = adminListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams)); const result = await listAdminOrganizations(query); return apiList(result.items, result.meta); } catch (error) { return apiError(error); } }
