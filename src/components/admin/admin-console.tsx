"use client";

import { AlertTriangle, Building2, FileText, Home, LogOut, Menu, Network, Search, ShieldCheck, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Badge, Card, EmptyState, Input, PageHeader } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ArticleAdmin } from "@/components/articles/article-admin";
import { TemuClientMark } from "@/components/brand/temuclient-logo";
import type { PlatformRole } from "@/generated/prisma/enums";
import type { listAdminArticles } from "@/modules/articles/service";
import type { getAdminDashboard, getAdminOpportunity, getAdminOrganization, listAdminAuditLogs, listAdminOpportunities, listAdminOrganizations, listAdminUsers, listAdminVerifications } from "@/modules/admin/service";
import { cn } from "@/lib/utils";

type Base = { role: PlatformRole | null; actorName: string };
export type AdminConsoleData = Base & (
  | { view: "forbidden" }
  | { view: "overview"; dashboard: Awaited<ReturnType<typeof getAdminDashboard>> }
  | { view: "users"; users: Awaited<ReturnType<typeof listAdminUsers>> }
  | { view: "companies"; organizations: Awaited<ReturnType<typeof listAdminOrganizations>> }
  | { view: "company"; organization: Awaited<ReturnType<typeof getAdminOrganization>> }
  | { view: "opportunities"; opportunities: Awaited<ReturnType<typeof listAdminOpportunities>> }
  | { view: "opportunity"; opportunity: Awaited<ReturnType<typeof getAdminOpportunity>> }
  | { view: "verifications"; verifications: Awaited<ReturnType<typeof listAdminVerifications>> }
  | { view: "audit"; auditLogs: Awaited<ReturnType<typeof listAdminAuditLogs>> }
  | { view: "articles"; articles: Awaited<ReturnType<typeof listAdminArticles>> }
  | { view: "planned"; plannedSection: string }
);

const navigation = [
  ["Overview", "/admin", Home], ["Users", "/admin/users", Users], ["Companies", "/admin/companies", Building2],
  ["Opportunities", "/admin/opportunities", FileText], ["Verification", "/admin/verifications", ShieldCheck],
  ["Articles", "/admin/articles", FileText],
  ["Reports", "/admin/reports", AlertTriangle], ["Subscriptions", "/admin/subscriptions", FileText], ["Taxonomy", "/admin/taxonomy", Network], ["Audit Logs", "/admin/audit-logs", FileText],
] as const;

export function AdminConsole({ data }: { data: AdminConsoleData }) {
  if (data.view === "forbidden") return <main className="grid min-h-screen place-items-center bg-background p-6"><EmptyState title="Akses admin ditolak" description="Akun Anda terautentikasi, tetapi tidak memiliki platform role SUPER_ADMIN, ADMIN, atau MODERATOR." action={<Link className="font-semibold text-brand-700" href="/app">Kembali ke workspace →</Link>} /></main>;
  return <AdminShell actorName={data.actorName} role={data.role}>{renderView(data)}</AdminShell>;
}

function AdminShell({ actorName, role, children }: { actorName: string; role: PlatformRole | null; children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
  async function logout() { await fetch("/api/v1/auth/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }
  const nav = <><div className="flex h-16 items-center gap-3 border-b px-4"><TemuClientMark className="size-9" /><div><p className="font-semibold">TemuClient</p><p className="text-[11px] text-text-muted">Platform Operations</p></div></div><nav className="flex-1 space-y-1 overflow-y-auto p-3">{navigation.map(([label, href, Icon]) => <Link className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium", pathname === href || (href !== "/admin" && pathname.startsWith(href)) ? "bg-brand-50 text-brand-700" : "text-text-secondary hover:bg-surface-subtle")} href={href} key={href} onClick={() => setOpen(false)}><Icon className="size-4" />{label}</Link>)}</nav><div className="border-t p-4"><p className="truncate text-sm font-semibold">{actorName}</p><p className="mt-1 text-xs text-text-muted">{role}</p><button className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-md text-sm text-text-secondary hover:text-text-primary" onClick={logout}><LogOut className="size-4" />Keluar</button></div></>;
  return <div className="min-h-screen bg-background"><aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-surface lg:flex">{nav}</aside><div className="lg:pl-64"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-surface/95 px-4 backdrop-blur sm:px-6"><button aria-label="Buka navigasi admin" className="flex size-10 items-center justify-center rounded-md border lg:hidden" onClick={() => setOpen(true)}><Menu className="size-4" /></button><div><p className="text-xs text-text-muted">Trust & moderation</p><p className="text-sm font-semibold">Admin Console</p></div><Badge tone="brand">{role}</Badge></header><main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">{children}</main></div>{open && <div className="fixed inset-0 z-50 bg-text-primary/30 lg:hidden" onClick={() => setOpen(false)}><aside className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-surface" onClick={(event) => event.stopPropagation()}><button aria-label="Tutup navigasi" className="absolute right-3 top-3 flex size-10 items-center justify-center" onClick={() => setOpen(false)}><X className="size-5" /></button>{nav}</aside></div>}</div>;
}

function renderView(data: Exclude<AdminConsoleData, Base & { view: "forbidden" }>) {
  if (data.view === "overview") return <Overview dashboard={data.dashboard} />;
  if (data.view === "users") return <UsersTable data={data.users} />;
  if (data.view === "companies") return <Companies data={data.organizations} />;
  if (data.view === "company") return <CompanyDetail data={data.organization} canSuspend={data.role !== "MODERATOR"} />;
  if (data.view === "opportunities") return <Opportunities data={data.opportunities} />;
  if (data.view === "opportunity") return <OpportunityDetail data={data.opportunity} />;
  if (data.view === "verifications") return <Verifications data={data.verifications} />;
  if (data.view === "audit") return <AuditLogs data={data.auditLogs} />;
  if (data.view === "articles") return <ArticleAdmin articles={data.articles} canUpload={data.role === "SUPER_ADMIN" || data.role === "ADMIN"} />;
  return <EmptyState title={`${data.plannedSection} belum termasuk Phase 9`} description="Navigasi disediakan sesuai admin shell. Fungsi operasional bagian ini akan diaktifkan pada fase yang mendefinisikan kontraknya." />;
}

function Overview({ dashboard }: { dashboard: Awaited<ReturnType<typeof getAdminDashboard>> }) {
  const metrics = [["Pending Verification", dashboard.metrics.pendingVerification], ["Active Opportunities", dashboard.metrics.activeOpportunities], ["Flagged", dashboard.metrics.flaggedOpportunities], ["Providers", dashboard.metrics.providers], ["Buyers", dashboard.metrics.buyers]];
  return <div className="space-y-6"><PageHeader eyebrow="Operations overview" title="Admin Dashboard" description="Sinyal trust dan aktivitas moderasi aktual dari PostgreSQL." /><section className="grid grid-cols-2 gap-3 xl:grid-cols-5">{metrics.map(([label, value]) => <Card className="p-4" key={label}><p className="text-xs text-text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></Card>)}</section><Card className="overflow-hidden"><div className="border-b p-4"><h2 className="font-semibold">Recent Moderation Actions</h2></div>{dashboard.recentActions.length ? <div className="divide-y">{dashboard.recentActions.map((item) => <div className="flex flex-wrap items-center justify-between gap-3 p-4" key={item.id}><div><p className="text-sm font-semibold">{item.action}</p><p className="mt-1 text-xs text-text-muted">{item.entityType} • {item.entityId}</p></div><div className="text-right"><p className="text-xs">{item.actor?.name ?? "System"}</p><p className="mt-1 text-xs text-text-muted">{formatDate(item.createdAt)}</p></div></div>)}</div> : <EmptyState title="Belum ada tindakan moderasi" description="Aktivitas approve, reject, flag, dan suspend akan tercatat di sini." />}</Card></div>;
}

function FilterHeader({ title, description }: { title: string; description: string }) { return <><PageHeader eyebrow="Platform operations" title={title} description={description} /><form className="mt-5 grid gap-3 rounded-lg border bg-surface p-3 sm:grid-cols-[1fr_auto]"><label className="relative"><Search className="absolute left-3 top-3.5 size-4 text-text-muted" /><Input className="pl-9" name="q" placeholder="Cari…" /></label><Button type="submit" variant="outline">Filter</Button></form></>; }

function UsersTable({ data }: { data: Awaited<ReturnType<typeof listAdminUsers>> }) { return <div><FilterHeader title="Users" description="Akun, platform role, membership, dan status akses." />{data.items.length ? <Table heads={["User", "Organizations", "Status", "Last login", "Created"]}>{data.items.map((item) => <tr className="border-t" key={item.id}><Cell><strong>{item.name}</strong><p className="text-xs text-text-muted">{item.email}</p></Cell><Cell>{item.memberships.map((m) => m.organization.name).join(", ") || "—"}</Cell><Cell><Badge tone={item.status === "ACTIVE" ? "success" : "warning"}>{item.status}</Badge></Cell><Cell>{item.lastLoginAt ? formatDate(item.lastLoginAt) : "—"}</Cell><Cell>{formatDate(item.createdAt)}</Cell></tr>)}</Table> : <EmptyState title="Tidak ada user" description="Ubah filter pencarian untuk melihat akun lain." />}</div>; }

function Companies({ data }: { data: Awaited<ReturnType<typeof listAdminOrganizations>> }) { return <div><FilterHeader title="Companies" description="Tenant Buyer, Provider, dan Hybrid dengan status trust independen." />{data.items.length ? <Table heads={["Company", "Type", "Status", "Verification", "Risk"]}>{data.items.map((item) => <tr className="border-t" key={item.id}><Cell><Link className="font-semibold hover:text-brand-700" href={`/admin/companies/${item.id}`}>{item.name}</Link><p className="text-xs text-text-muted">{item.city ?? "Lokasi belum diisi"}</p></Cell><Cell>{item.type}</Cell><Cell><Badge tone={item.status === "ACTIVE" ? "success" : "danger"}>{item.status}</Badge></Cell><Cell>{item.verifications.filter((v) => v.status === "VERIFIED").length}/{new Set(item.verifications.map((v) => v.type)).size || 3}</Cell><Cell><Badge tone={item._count.riskFlags ? "warning" : "neutral"}>{item._count.riskFlags} open</Badge></Cell></tr>)}</Table> : <EmptyState title="Tidak ada company" description="Ubah filter untuk melihat tenant lain." />}</div>; }

function CompanyDetail({ data, canSuspend }: { data: Awaited<ReturnType<typeof getAdminOrganization>>; canSuspend: boolean }) {
  const pending = data.verifications.find((item) => item.status === "PENDING");
  return <div className="space-y-5"><PageHeader eyebrow="Company review" title={data.name} description={`${data.type} • ${data.city ?? "Lokasi belum diisi"} • ${data.status}`} action={canSuspend && data.status !== "SUSPENDED" ? <MutationButton label="Suspend" url={`/api/v1/admin/organizations/${data.id}/suspend`} reason /> : undefined} /><div className="grid gap-5 xl:grid-cols-[1fr_340px]"><div className="space-y-4"><Info title="Company">{data.website ?? "No website"} • {data.businessEmail ?? "No business email"}</Info><Info title="Members">{data.members.map((m) => `${m.user.name} (${m.role})`).join(" • ") || "No active members"}</Info><Info title="Services & Portfolio">{data.services.map((s) => s.serviceCategory.name).join(" • ") || "No services"} • {data.portfolios.length} portfolio</Info><Info title="Activity">{data.buyerOpportunities.length} recent opportunity records retained.</Info><Info title="Risk flags">{[...data.riskSignals.map((f) => `${f.severity}: ${f.description}`), ...data.riskFlags.map((f) => `${f.severity}: ${f.reason}`)].join(" • ") || "No open risk signals."}</Info></div><aside className="space-y-4"><VerificationList items={data.verifications} />{pending && <DecisionPanel id={pending.id} />}</aside></div></div>;
}

function Opportunities({ data }: { data: Awaited<ReturnType<typeof listAdminOpportunities>> }) { return <div><FilterHeader title="Opportunities" description="Requirement, buyer intent, verification, dan risk flag aktual." />{data.items.length ? <Table heads={["Opportunity", "Buyer", "Status", "Intent", "Verification", "Flags"]}>{data.items.map((item) => <tr className="border-t" key={item.id}><Cell><Link className="font-semibold hover:text-brand-700" href={`/admin/opportunities/${item.id}`}>{item.title}</Link></Cell><Cell>{item.buyerOrganization.name}</Cell><Cell><Badge tone="brand">{item.status}</Badge></Cell><Cell>{item.intentScore}</Cell><Cell>{item.verificationLevel}/5</Cell><Cell><Badge tone={item._count.riskFlags ? "warning" : "neutral"}>{item._count.riskFlags}</Badge></Cell></tr>)}</Table> : <EmptyState title="Tidak ada opportunity" description="Ubah filter untuk melihat requirement lain." />}</div>; }

function OpportunityDetail({ data }: { data: Awaited<ReturnType<typeof getAdminOpportunity>> }) {
  const pending = data.verifications.find((item) => item.status === "PENDING");
  return <div className="space-y-5"><PageHeader eyebrow="Opportunity moderation" title={data.title} description={`${data.buyerOrganization.name} • Intent ${data.intentScore} • ${data.status}`} /><div className="grid gap-5 xl:grid-cols-[1fr_340px]"><div className="space-y-4"><Info title="Buyer & Company">{data.buyerOrganization.name} • {data.buyerOrganization.status}</Info><Info title="Requirement">{data.problemStatement} {data.requirements.map((r) => r.label).join(" • ")}</Info><Info title="Budget & Timeline">{money(data.budgetMin, data.currency)}–{money(data.budgetMax, data.currency)} • {data.timelineStart ? formatDate(data.timelineStart) : "TBD"}–{data.timelineEnd ? formatDate(data.timelineEnd) : "TBD"}</Info><Info title="Contact">{data.buyerOrganization.businessEmail ?? data.buyerOrganization.members[0]?.user.email ?? "No verified contact"}</Info><Info title="History">Created {formatDate(data.createdAt)} • Updated {formatDate(data.updatedAt)}</Info></div><aside className="space-y-4"><VerificationList items={[...data.buyerOrganization.verifications, ...data.verifications]} /><Info title="Risk flags">{[...data.riskSignals.map((f) => `${f.severity}: ${f.description}`), ...data.riskFlags.map((f) => `${f.severity}: ${f.reason}`)].join(" • ") || "No open signal."}</Info><MutationButton label="Flag Opportunity" url={`/api/v1/admin/opportunities/${data.id}/flag`} reason body={{ severity: "MEDIUM", signal: "MANUAL_REVIEW" }} />{pending && <DecisionPanel id={pending.id} />}</aside></div></div>;
}

function Verifications({ data }: { data: Awaited<ReturnType<typeof listAdminVerifications>> }) { return <div><FilterHeader title="Verification Queue" description="Setiap tipe diputuskan independen; antrean tertua tampil lebih dulu." />{data.items.length ? <Table heads={["Entity", "Type", "Status", "Submitted", "Reviewer", "Action"]}>{data.items.map((item) => <tr className="border-t" key={item.id}><Cell><strong>{item.organization?.name ?? item.opportunity?.title ?? "Unknown"}</strong></Cell><Cell>{item.type}</Cell><Cell><Badge tone={item.status === "VERIFIED" ? "success" : item.status === "REJECTED" ? "danger" : "warning"}>{item.status}</Badge></Cell><Cell>{formatDate(item.createdAt)}</Cell><Cell>{item.verifiedBy?.name ?? "—"}</Cell><Cell>{item.status === "PENDING" ? <DecisionPanel compact id={item.id} /> : "Read only"}</Cell></tr>)}</Table> : <EmptyState title="Antrean verifikasi kosong" description="Permintaan baru dari organisasi akan tampil di sini." />}</div>; }

function AuditLogs({ data }: { data: Awaited<ReturnType<typeof listAdminAuditLogs>> }) { return <div><FilterHeader title="Audit Logs" description="Riwayat immutable untuk tindakan sensitif dan perubahan domain." />{data.items.length ? <Table heads={["Timestamp", "Actor", "Action", "Entity", "Context"]}>{data.items.map((item) => <tr className="border-t align-top" key={item.id}><Cell>{formatDate(item.createdAt)}</Cell><Cell>{item.actorUser?.name ?? "System"}<p className="text-xs text-text-muted">{item.ipAddress ?? "No IP"}</p></Cell><Cell><strong>{item.action}</strong></Cell><Cell>{item.entityType}<p className="max-w-44 truncate text-xs text-text-muted">{item.entityId}</p></Cell><Cell><details><summary className="cursor-pointer text-xs font-semibold text-brand-700">Before / After</summary><pre className="mt-2 max-w-sm overflow-auto whitespace-pre-wrap text-[10px]">{JSON.stringify({ before: item.beforeJson, after: item.afterJson, metadata: item.metadataJson }, null, 2)}</pre></details></Cell></tr>)}</Table> : <EmptyState title="Audit log kosong" description="Tidak ada record yang cocok dengan filter." />}</div>; }

function DecisionPanel({ id, compact = false }: { id: string; compact?: boolean }) { return <div className={cn("grid gap-2", compact ? "min-w-48 grid-cols-3" : "grid-cols-1 sm:grid-cols-3")}><MutationButton label="Approve" url={`/api/v1/admin/verifications/${id}/approve`} /><MutationButton label="Info" url={`/api/v1/admin/verifications/${id}/request-information`} reason /><MutationButton label="Reject" url={`/api/v1/admin/verifications/${id}/reject`} reason /></div>; }

function MutationButton({ label, url, reason = false, body }: { label: string; url: string; reason?: boolean; body?: Record<string, string> }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string>();
  async function run() { const explanation = reason ? window.prompt(`Alasan ${label.toLowerCase()} (minimal 10 karakter):`) : undefined; if (reason && !explanation) return; setBusy(true); setMessage(undefined); try { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, ...(explanation ? { reason: explanation } : {}) }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "Tindakan gagal."); setMessage("Berhasil"); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Tindakan gagal."); } finally { setBusy(false); } }
  return <div><Button className="w-full" disabled={busy} onClick={run} variant={label === "Approve" ? "default" : "outline"}>{busy ? "…" : label}</Button>{message && <p aria-live="polite" className="mt-1 text-[10px] text-text-secondary">{message}</p>}</div>;
}

function VerificationList({ items }: { items: { id: string; type: string; status: string }[] }) { return <Card className="p-4"><h2 className="font-semibold">Verification</h2><div className="mt-4 space-y-2">{items.length ? items.map((item) => <div className="flex justify-between gap-3 text-sm" key={item.id}><span>{item.type}</span><Badge tone={item.status === "VERIFIED" ? "success" : item.status === "REJECTED" ? "danger" : "warning"}>{item.status}</Badge></div>) : <p className="text-sm text-text-muted">No verification attempts.</p>}</div></Card>; }
function Info({ title, children }: { title: string; children: React.ReactNode }) { return <Card className="p-5"><h2 className="font-semibold">{title}</h2><div className="mt-3 text-sm leading-7 text-text-secondary">{children}</div></Card>; }
function Table({ heads, children }: { heads: string[]; children: React.ReactNode }) { return <div className="mt-4 overflow-x-auto rounded-lg border bg-surface"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-surface-subtle text-xs text-text-secondary"><tr>{heads.map((head) => <th className="px-4 py-3 font-medium" key={head}>{head}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function Cell({ children }: { children: React.ReactNode }) { return <td className="px-4 py-3">{children}</td>; }
function formatDate(value: string | Date) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
function money(value: string | bigint | null, currency: string) { return value ? new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value)) : "Undisclosed"; }
