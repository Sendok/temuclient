import { redirect } from "next/navigation";

import { AdminConsole, type AdminConsoleData } from "@/components/admin/admin-console";
import { listAdminArticles } from "@/modules/articles/service";
import { adminListQuerySchema, auditLogQuerySchema } from "@/modules/admin/schema";
import { getAdminDashboard, getAdminOpportunity, getAdminOrganization, listAdminAuditLogs, listAdminOpportunities, listAdminOrganizations, listAdminUsers, listAdminVerifications } from "@/modules/admin/service";
import { getCurrentSession } from "@/server/auth/session";

export default async function AdminPage({ params, searchParams }: { params: Promise<{ slug?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/admin/login");
  const { slug = [] } = await params;
  const raw = await searchParams;
  const queryObject = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const role = session.user.platformRole;
  if (!role) redirect("/app");
  const view = slug.join("/");
  let data: AdminConsoleData;
  if (!view) data = { view: "overview", role, actorName: session.user.name, dashboard: await getAdminDashboard() };
  else if (view === "users") data = { view: "users", role, actorName: session.user.name, users: await listAdminUsers(adminListQuerySchema.parse(queryObject)) };
  else if (view === "companies") data = { view: "companies", role, actorName: session.user.name, organizations: await listAdminOrganizations(adminListQuerySchema.parse(queryObject)) };
  else if (slug[0] === "companies" && slug[1]) data = { view: "company", role, actorName: session.user.name, organization: await getAdminOrganization(slug[1]) };
  else if (view === "opportunities") data = { view: "opportunities", role, actorName: session.user.name, opportunities: await listAdminOpportunities(adminListQuerySchema.parse(queryObject)) };
  else if (slug[0] === "opportunities" && slug[1]) data = { view: "opportunity", role, actorName: session.user.name, opportunity: await getAdminOpportunity(slug[1]) };
  else if (view === "verifications") data = { view: "verifications", role, actorName: session.user.name, verifications: await listAdminVerifications(adminListQuerySchema.parse(queryObject)) };
  else if (view === "audit-logs") data = { view: "audit", role, actorName: session.user.name, auditLogs: await listAdminAuditLogs(auditLogQuerySchema.parse(queryObject)) };
  else if (view === "articles") data = { view: "articles", role, actorName: session.user.name, articles: await listAdminArticles() };
  else data = { view: "planned", role, actorName: session.user.name, plannedSection: slug[0] ?? "admin" };
  return <AdminConsole data={data} />;
}
