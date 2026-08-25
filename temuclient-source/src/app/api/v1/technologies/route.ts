import { apiError, apiSuccess } from "@/lib/api-response";
import { db } from "@/server/db/client";

export async function GET() { try { return apiSuccess(await db.technology.findMany({ select: { id: true, name: true, slug: true, category: true }, orderBy: [{ category: "asc" }, { name: "asc" }] })); } catch (error) { return apiError(error); } }
