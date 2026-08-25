import { apiError, apiSuccess } from "@/lib/api-response";
import { db } from "@/server/db/client";

export async function GET() { try { return apiSuccess(await db.serviceCategory.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true, description: true, parentId: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })); } catch (error) { return apiError(error); } }
