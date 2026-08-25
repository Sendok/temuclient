import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { AuthPage } from "@/components/foundation/auth-page";
import { RoleOnboarding } from "@/components/foundation/onboarding";
import { AudiencePage } from "@/components/marketing/audience-page";
import { PublicPrototype } from "@/components/prototype/marketing-prototype";
import { getCurrentSession } from "@/server/auth/session";

const publicRoutes = new Set(["for-providers", "for-buyers", "pricing", "login", "register", "forgot-password", "reset-password", "onboarding"]);

const publicMetadata: Record<string, Metadata> = {
  "for-providers": { title: "Cari Client untuk Perusahaan Penyedia Jasa", description: "Temukan perusahaan yang sedang membutuhkan jasa software, konsultasi IT, agency, atau layanan teknologi Anda.", alternates: { canonical: "/for-providers" } },
  "for-buyers": { title: "Cari Vendor yang Tepat untuk Perusahaan Anda", description: "Ceritakan kebutuhan bisnis Anda dan dapatkan beberapa pilihan vendor yang sesuai untuk dibandingkan.", alternates: { canonical: "/for-buyers" } },
  pricing: { title: "Harga TemuClient", description: "Pilihan paket TemuClient untuk membangun pipeline B2B berkualitas dengan matching dan introduction terverifikasi.", alternates: { canonical: "/pricing" } },
};

export async function generateMetadata({ params }: { params: Promise<{ public: string }> }): Promise<Metadata> {
  const slug = (await params).public;
  return publicMetadata[slug] ?? { title: "Akun TemuClient", robots: { index: false, follow: false } };
}

export default async function PublicPage({ params, searchParams }: { params: Promise<{ public: string }>; searchParams: Promise<{ token?: string }> }) {
  const [{ public: slug }, query] = await Promise.all([params, searchParams]);
  if (!publicRoutes.has(slug)) notFound();
  const session = await getCurrentSession();
  if (["login", "register"].includes(slug) && session) redirect(session.activeOrganizationId ? "/app" : "/onboarding");
  if (slug === "login") return <AuthPage mode="login" />;
  if (slug === "register") return <AuthPage mode="register" />;
  if (slug === "forgot-password") return <AuthPage mode="forgot" />;
  if (slug === "reset-password") return <AuthPage mode="reset" token={query.token} />;
  if (slug === "for-providers") return <AudiencePage kind="provider" />;
  if (slug === "for-buyers") return <AudiencePage kind="buyer" />;
  if (slug === "onboarding") {
    if (!session) redirect("/login");
    if (session.activeOrganizationId) redirect("/app");
    return <RoleOnboarding name={session.user.name} />;
  }
  return <PublicPrototype slug={slug} />;
}
