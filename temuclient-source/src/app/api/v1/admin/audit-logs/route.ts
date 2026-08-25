import { apiError, apiList } from "@/lib/api-response";
import { auditLogQuerySchema } from "@/modules/admin/schema";
import { listAdminAuditLogs } from "@/modules/admin/service";
import { requirePlatformRole } from "@/server/auth/authorization";

export async function GET(request: Request) { try { await requirePlatformRole(); const query = auditLogQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams)); const result = await listAdminAuditLogs(query); return apiList(result.items, result.meta); } catch (error) { return apiError(error); } }
