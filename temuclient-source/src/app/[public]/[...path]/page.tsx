import { notFound, redirect } from "next/navigation";

import { OrganizationOnboarding } from "@/components/foundation/onboarding";
import { ProviderOnboardingWizard } from "@/components/company/provider-capability";
import { getProviderProfile } from "@/modules/provider/service";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";

export default async function NestedPublicPage({ params }: { params: Promise<{ public: string; path: string[] }> }) {
  const { public: slug, path } = await params;
  if (slug !== "onboarding") notFound();
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const route = path.join("/");
  if (route === "provider/company") { if (session.activeOrganizationId) redirect("/app"); return <OrganizationOnboarding type="PROVIDER" />; }
  if (route === "buyer/company") { if (session.activeOrganizationId) redirect("/app"); return <OrganizationOnboarding type="BUYER" />; }
  const providerSteps = new Set(["services", "project-range", "industries", "portfolio", "team", "verification", "complete"]);
  if (path[0] === "provider" && providerSteps.has(path[1] ?? "")) {
    if (!session.activeOrganizationId) redirect("/onboarding/provider/company");
    const membership = await db.organizationMember.findFirst({ where: { userId: session.userId, organizationId: session.activeOrganizationId, status: "ACTIVE" }, include: { organization: true } });
    if (!membership || !["PROVIDER", "HYBRID"].includes(membership.organization.type)) redirect("/app");
    const [profile, services, industries, technologies] = await Promise.all([
      getProviderProfile(membership.organizationId, Boolean(session.user.emailVerifiedAt)),
      db.serviceCategory.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true }, orderBy: { sortOrder: "asc" } }),
      db.industry.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true }, orderBy: { sortOrder: "asc" } }),
      db.technology.findMany({ select: { id: true, name: true, category: true }, orderBy: { name: "asc" } }),
    ]);
    return <ProviderOnboardingWizard canEdit={["OWNER", "ADMIN"].includes(membership.role)} profile={profile} step={path[1]} taxonomies={{ services, industries, technologies }} />;
  }
  notFound();
}
