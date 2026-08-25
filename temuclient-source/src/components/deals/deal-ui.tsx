"use client";

import { ArrowRight, CalendarDays, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from "@/components/ui/primitives";
import { formatInTimezone } from "@/lib/dates/timezone";
import { formatMoney } from "@/lib/money/format";
import { cn } from "@/lib/utils";
import type { DealData, DealListData } from "@/modules/deals/service";
import type { ProposalData } from "@/modules/proposals/service";

const activeStages = ["INTRODUCTION", "DISCOVERY", "PROPOSAL", "NEGOTIATION"] as const;

export function DealPipeline({
  deals,
  view,
  filters,
}: {
  deals: DealListData;
  view: "board" | "list" | "closed";
  filters: Record<string, string | undefined>;
}) {
  const visibleDeals = view === "closed" ? deals : deals.filter((deal) => deal.status === "OPEN");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Provider pipeline"
        title="Deals"
        description="Progress komersial dari Introduction hingga keputusan akhir."
      />
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex gap-2">
          <ViewLink active={view === "board"} href="/app/deals?view=board">Board</ViewLink>
          <ViewLink active={view === "list"} href="/app/deals?view=list">List</ViewLink>
          <ViewLink active={view === "closed"} href="/app/deals?view=closed">Closed</ViewLink>
        </nav>
        <form className="flex gap-2" method="get">
          <input name="view" type="hidden" value={view} />
          <Input className="min-w-0 sm:w-60" defaultValue={filters.q} name="q" placeholder="Cari company atau opportunity" />
          <Button type="submit" variant="outline">Cari</Button>
        </form>
      </div>
      {!visibleDeals.length ? (
        <EmptyState
          title={view === "closed" ? "Belum ada Deal tertutup" : "Belum ada Deal aktif"}
          description="Deal dibuat otomatis saat Buyer menerima Introduction."
          action={<Link className="text-sm font-semibold text-brand-700" href="/app/introductions">Lihat Introductions →</Link>}
        />
      ) : view === "board" ? (
        <div className="grid gap-4 xl:grid-cols-4">
          {activeStages.map((stage) => (
            <section className="min-w-0" key={stage}>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold tracking-wide text-text-secondary">{stage}</h2><Badge>{visibleDeals.filter((deal) => deal.stage === stage).length}</Badge></div>
              <div className="space-y-3">
                {visibleDeals.filter((deal) => deal.stage === stage).map((deal) => <DealCard deal={deal} key={deal.id} />)}
                {!visibleDeals.some((deal) => deal.stage === stage) ? <div className="rounded-lg border border-dashed p-4 text-center text-xs text-text-muted">Tidak ada Deal</div> : null}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <DealList deals={visibleDeals} />
      )}
    </div>
  );
}

function DealCard({ deal }: { deal: DealListData[number] }) {
  return (
    <Link href={`/app/deals/${deal.id}`}>
      <Card className="p-4 transition hover:border-brand-300 hover:bg-brand-50/30">
        <p className="text-xs text-text-muted">{deal.buyerOrganization.name}</p>
        <h3 className="mt-1 text-sm font-semibold leading-5">{deal.opportunity.title}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><Metric label="Value" value={formatMoney(deal.estimatedValue, deal.currency)} /><Metric label="Probability" value={`${deal.probability}%`} /></div>
        <div className="mt-4 border-t pt-3 text-xs"><p className="text-text-muted">Last activity</p><p className="mt-1 truncate text-text-secondary">{deal.latestActivity?.title ?? "Belum ada aktivitas"}</p><p className="mt-3 font-medium text-brand-700">{deal.nextAction}</p></div>
      </Card>
    </Link>
  );
}

function DealList({ deals }: { deals: DealListData }) {
  return <Card className="overflow-hidden"><div className="hidden grid-cols-[1.5fr_1fr_1fr_100px_130px] gap-4 border-b bg-surface-subtle px-5 py-3 text-xs font-semibold text-text-muted md:grid"><span>Deal</span><span>Company</span><span>Value</span><span>Probability</span><span>Stage</span></div>{deals.map((deal) => <Link className="grid gap-2 border-b px-5 py-4 last:border-0 hover:bg-surface-subtle md:grid-cols-[1.5fr_1fr_1fr_100px_130px] md:items-center md:gap-4" href={`/app/deals/${deal.id}`} key={deal.id}><div><p className="text-sm font-semibold">{deal.title}</p><p className="mt-1 text-xs text-text-muted">{deal.opportunity.title}</p></div><p className="text-sm text-text-secondary">{deal.buyerOrganization.name}</p><p className="text-sm tabular-nums">{formatMoney(deal.estimatedValue, deal.currency)}</p><p className="text-sm tabular-nums">{deal.probability}%</p><Badge tone={deal.stage === "WON" ? "success" : deal.stage === "LOST" ? "danger" : "brand"}>{deal.stage}</Badge></Link>)}</Card>;
}

export function DealDetail({
  deal,
  currentUserId,
  role,
  tab = "overview",
}: {
  deal: DealData;
  currentUserId: string;
  role: "OWNER" | "ADMIN" | "SALES" | "MEMBER";
  tab?: string;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<"activity" | "proposal" | "lost" | "won" | "edit" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canManage = role === "OWNER" || role === "ADMIN" || (role === "SALES" && deal.owner.id === currentUserId);
  const open = deal.status === "OPEN";
  const nextStage = deal.stage === "INTRODUCTION" ? "DISCOVERY" : deal.stage === "DISCOVERY" ? "PROPOSAL" : deal.stage === "PROPOSAL" ? "NEGOTIATION" : null;
  async function mutate(path: string, method: "POST" | "PATCH", body?: object) {
    setBusy(true); setError("");
    const response = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { setError(payload.error?.message ?? "Deal gagal diperbarui."); return false; }
    setPanel(null); router.refresh(); return true;
  }
  return (
    <div className="space-y-6">
      <Link className="text-sm font-semibold text-brand-700" href="/app/deals">← Kembali ke pipeline</Link>
      <PageHeader eyebrow={deal.buyerOrganization.name} title={deal.title} description={deal.opportunity.title} action={<Badge tone={deal.stage === "WON" ? "success" : deal.stage === "LOST" ? "danger" : "brand"}>{deal.stage}</Badge>} />
      <Card className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Estimated value" value={formatMoney(deal.estimatedValue, deal.currency)} /><Metric label="Probability" value={`${deal.probability}%`} /><Metric label="Owner" value={deal.owner.name} /><Metric label="Expected close" value={deal.expectedCloseDate ? formatInTimezone(deal.expectedCloseDate, "Asia/Jakarta", { dateStyle: "medium" }) : "Belum ditentukan"} /></Card>
      {canManage && open ? <div className="flex flex-wrap gap-2">{nextStage ? <Button disabled={busy} onClick={() => mutate(`/api/v1/deals/${deal.id}/stage`, "POST", { stage: nextStage })}>Advance to {nextStage}<ArrowRight className="size-4" /></Button> : null}<Button onClick={() => setPanel("activity")} variant="outline"><Plus className="size-4" />Add activity</Button><Link href={`/app/meetings?conversation=${deal.conversationId ?? ""}`}><Button variant="outline"><CalendarDays className="size-4" />Schedule meeting</Button></Link>{deal.stage !== "INTRODUCTION" ? <Button onClick={() => setPanel("proposal")} variant="outline">Create proposal</Button> : null}{deal.stage === "NEGOTIATION" ? <Button onClick={() => setPanel("won")} variant="outline">Mark Won</Button> : null}<Button className="border-danger-200 text-danger-700" onClick={() => setPanel("lost")} variant="outline">Mark Lost</Button><Button onClick={() => setPanel("edit")} variant="outline">Edit Deal</Button></div> : null}
      <div><Link href={`/app/ai-sales?task=deal-coach&entity=${deal.id}`}><Button variant="outline">Open AI Deal Coach</Button></Link></div>
      {!canManage && role !== "MEMBER" ? <Card className="border-warning-100 bg-warning-50 p-4 text-sm text-text-secondary">Deal ini ditugaskan kepada {deal.owner.name}. Sales lain memiliki akses read-only.</Card> : null}
      {role === "MEMBER" ? <Card className="p-4 text-sm text-text-secondary">Role Member memiliki akses read-only ke Deal.</Card> : null}
      {error ? <Card className="border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">{error}</Card> : null}
      {panel === "activity" ? <ActivityForm dealId={deal.id} onSubmit={(body) => mutate(`/api/v1/deals/${deal.id}/activities`, "POST", body)} /> : null}
      {panel === "proposal" ? <ProposalForm dealId={deal.id} onSubmit={(body) => mutate(`/api/v1/deals/${deal.id}/proposals`, "POST", body)} /> : null}
      {panel === "lost" ? <LostForm onSubmit={(reason) => mutate(`/api/v1/deals/${deal.id}/lost`, "POST", { reason })} /> : null}
      {panel === "won" ? <WonForm defaultValue={deal.estimatedValue} onSubmit={(finalValue) => mutate(`/api/v1/deals/${deal.id}/won`, "POST", { finalValue })} /> : null}
      {panel === "edit" ? <DealEditForm deal={deal} onSubmit={(body) => mutate(`/api/v1/deals/${deal.id}`, "PATCH", body)} /> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
        <main className="min-w-0 space-y-5">
          <DealTabs active={tab} dealId={deal.id} />
          <DealTabContent deal={deal} tab={tab} />
        </main>
        <DealIntelligence deal={deal} />
      </div>
    </div>
  );
}

function DealTabs({ dealId, active }: { dealId: string; active: string }) {
  const tabs = ["overview", "activity", "messages", "meetings", "proposal", "notes"];
  return <nav className="flex gap-1 overflow-x-auto border-b">{tabs.map((item) => <Link className={cn("whitespace-nowrap px-3 py-3 text-sm font-medium capitalize", active === item ? "border-b-2 border-brand-600 text-brand-700" : "text-text-secondary")} href={`/app/deals/${dealId}?tab=${item}`} key={item}>{item}</Link>)}</nav>;
}

function DealTabContent({ deal, tab }: { deal: DealData; tab: string }) {
  if (tab === "messages") return deal.conversationId ? <EmptyState title="Conversation terhubung" description="Buka thread bisnis tanpa menduplikasi pesan ke dalam Deal." action={<Link className="font-semibold text-brand-700" href={`/app/messages?conversation=${deal.conversationId}`}>Buka Messages →</Link>} /> : <EmptyState title="Conversation belum tersedia" description="Deal ini belum memiliki Conversation aktif." />;
  if (tab === "meetings") return deal.meetings.length ? <div className="space-y-3">{deal.meetings.map((meeting) => <Card className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center" key={meeting.id}><div><p className="font-semibold">{meeting.title}</p><p className="mt-1 text-sm text-text-secondary">{formatInTimezone(meeting.startsAt, meeting.timezone)}</p></div><div className="flex items-center gap-3"><Badge>{meeting.status}</Badge><Link className="text-sm font-semibold text-brand-700" href={`/app/meetings/${meeting.id}`}>View</Link></div></Card>)}</div> : <EmptyState title="Belum ada meeting" description="Jadwalkan discovery meeting untuk melanjutkan Deal." />;
  if (tab === "proposal") return deal.proposals.length ? <div className="space-y-3">{deal.proposals.map((proposal) => <Card className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center" key={proposal.id}><div><p className="font-semibold">v{proposal.version} · {proposal.title}</p><p className="mt-1 text-sm text-text-secondary">{formatMoney(proposal.amount, proposal.currency)}</p></div><div className="flex items-center gap-3"><Badge tone={proposal.status === "ACCEPTED" ? "success" : proposal.status === "REJECTED" ? "danger" : "brand"}>{proposal.status}</Badge><Link className="text-sm font-semibold text-brand-700" href={`/app/proposals/${proposal.id}`}>Open</Link></div></Card>)}</div> : <EmptyState title="Belum ada proposal" description="Buat proposal setelah kebutuhan discovery cukup jelas." />;
  const activities = tab === "notes" ? deal.activities.filter((activity) => activity.type === "NOTE") : deal.activities;
  if (tab === "activity" || tab === "notes") return <ActivityTimeline activities={activities} emptyTitle={tab === "notes" ? "Belum ada internal note" : "Belum ada activity"} />;
  return <div className="space-y-4"><Card className="p-5"><h2 className="font-semibold">Opportunity context</h2><p className="mt-3 text-sm leading-6 text-text-secondary">{deal.opportunity.problemStatement}</p><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Metric label="Buyer company" value={deal.buyerOrganization.name} /><Metric label="Location" value={deal.buyerOrganization.city ?? "Indonesia"} /><Metric label="Opportunity budget" value={`${formatMoney(deal.opportunity.budgetMin, deal.opportunity.currency)} – ${formatMoney(deal.opportunity.budgetMax, deal.opportunity.currency)}`} /><Metric label="Next action" value={deal.nextAction} /></dl></Card><ActivityTimeline activities={deal.activities.slice(0, 5)} emptyTitle="Belum ada activity" /></div>;
}

function ActivityTimeline({ activities, emptyTitle }: { activities: DealData["activities"]; emptyTitle: string }) {
  if (!activities.length) return <EmptyState title={emptyTitle} description="Activity yang dicatat tim Provider akan muncul di timeline internal ini." />;
  return <Card className="divide-y">{activities.map((activity) => <article className="p-4" key={activity.id}><div className="flex items-start justify-between gap-3"><div><Badge>{activity.type}</Badge><h3 className="mt-2 text-sm font-semibold">{activity.title}</h3></div><time className="text-xs text-text-muted">{formatInTimezone(activity.occurredAt)}</time></div>{activity.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{activity.description}</p> : null}<p className="mt-2 text-xs text-text-muted">{activity.user.name}</p></article>)}</Card>;
}

function DealIntelligence({ deal }: { deal: DealData }) {
  return <aside className="space-y-4"><Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Operational health</p><p className="mt-2 text-3xl font-semibold tabular-nums">{deal.health.score}<span className="text-base text-text-muted">/100</span></p>{deal.health.positives.length ? <div className="mt-4"><p className="text-xs font-semibold text-success-700">Positive</p>{deal.health.positives.map((item) => <p className="mt-2 text-xs text-text-secondary" key={item}>✓ {item}</p>)}</div> : null}{deal.health.risks.length ? <div className="mt-4"><p className="text-xs font-semibold text-warning-700">Risks</p>{deal.health.risks.map((item) => <p className="mt-2 text-xs text-text-secondary" key={item}>⚠ {item}</p>)}</div> : null}</Card><Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Next best action</p><p className="mt-3 text-sm font-medium leading-6">{deal.nextAction}</p></Card><Card className="p-5"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted"><Users className="size-4" />Stakeholders</p><p className="mt-3 text-sm font-medium">{deal.owner.name}</p><p className="text-xs text-text-muted">Deal owner</p>{deal.stakeholders.map((person) => <div className="mt-3" key={person.id}><p className="text-sm font-medium">{person.name}</p><p className="text-xs text-text-muted">Buyer contact</p></div>)}</Card></aside>;
}

export function ProposalEditor({ proposal, canManage }: { proposal: ProposalData; canManage: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function mutate(path: string, method: "POST" | "PATCH", body?: object) { setBusy(true); setError(""); const response = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); const payload = await response.json(); setBusy(false); if (!response.ok) { setError(payload.error?.message ?? "Proposal gagal diperbarui."); return; } router.refresh(); }
  async function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await mutate(`/api/v1/proposals/${proposal.id}`, "PATCH", { title: form.get("title"), summary: form.get("summary") || null, amount: form.get("amount") || null, currency: form.get("currency"), documentUrl: form.get("documentUrl") || null }); }
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><Link className="text-sm font-semibold text-brand-700" href={`/app/deals/${proposal.dealId}?tab=proposal`}>← Kembali ke Deal</Link>{proposal.status === "DRAFT" && canManage ? <Link href={`/app/ai-sales?task=proposal-outline&entity=${proposal.dealId}`}><Button variant="outline">Generate AI Outline</Button></Link> : null}</div><PageHeader eyebrow={`Proposal v${proposal.version}`} title={proposal.title} description={`${proposal.deal.buyerOrganization.name} · ${proposal.deal.opportunity.title}`} action={<Badge tone={proposal.status === "ACCEPTED" ? "success" : proposal.status === "REJECTED" ? "danger" : "brand"}>{proposal.status}</Badge>} />{error ? <Card className="border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">{error}</Card> : null}<Card className="p-5">{proposal.status === "DRAFT" && canManage ? <form className="grid gap-4" onSubmit={save}><label className="text-sm">Title<Input className="mt-1" defaultValue={proposal.title} name="title" required /></label><label className="text-sm">Summary<textarea className="mt-1 min-h-40 w-full rounded-md border bg-surface p-3 text-sm" defaultValue={proposal.summary ?? ""} name="summary" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Amount<Input className="mt-1" defaultValue={proposal.amount ?? ""} min="0" name="amount" type="number" /></label><label className="text-sm">Currency<Input className="mt-1" defaultValue={proposal.currency} name="currency" /></label></div><label className="text-sm">Document URL<Input className="mt-1" defaultValue={proposal.documentUrl ?? ""} name="documentUrl" type="url" /></label><div className="flex flex-wrap gap-2"><Button disabled={busy} type="submit">Save draft</Button><Button disabled={busy} onClick={() => mutate(`/api/v1/proposals/${proposal.id}/submit`, "POST")} variant="outline">Submit Proposal</Button><Button disabled={busy} onClick={() => mutate(`/api/v1/proposals/${proposal.id}`, "PATCH", { status: "WITHDRAWN" })} variant="outline">Withdraw</Button></div></form> : <div className="space-y-5"><Metric label="Summary" value={proposal.summary ?? "Tidak ada summary"} /><Metric label="Amount" value={formatMoney(proposal.amount, proposal.currency)} />{proposal.documentUrl ? <a className="text-sm font-semibold text-brand-700" href={proposal.documentUrl} rel="noreferrer" target="_blank">Open document →</a> : null}{proposal.status === "SUBMITTED" && canManage ? <div className="flex gap-2"><Button disabled={busy} onClick={() => mutate(`/api/v1/proposals/${proposal.id}`, "PATCH", { status: "ACCEPTED" })}>Mark Accepted</Button><Button disabled={busy} onClick={() => mutate(`/api/v1/proposals/${proposal.id}`, "PATCH", { status: "REJECTED" })} variant="outline">Mark Rejected</Button><Button disabled={busy} onClick={() => mutate(`/api/v1/proposals/${proposal.id}`, "PATCH", { status: "WITHDRAWN" })} variant="outline">Withdraw</Button></div> : null}</div>}</Card></div>;
}

function ActivityForm({ dealId, onSubmit }: { dealId: string; onSubmit: (body: object) => Promise<boolean> }) { const [type, setType] = useState("NOTE"); return <Card className="p-5"><h2 className="font-semibold">Add activity</h2><form className="mt-4 grid gap-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await onSubmit({ type, title: form.get("title"), description: form.get("description") || null, dealId }); }}><label className="text-sm">Type<Select className="mt-1 w-full" onChange={(event) => setType(event.target.value)} value={type}><option value="NOTE">Note</option><option value="CALL">Call</option><option value="EMAIL">Email</option><option value="MEETING">Meeting</option></Select></label><label className="text-sm">Title<Input className="mt-1" name="title" required /></label><label className="text-sm">Description<textarea className="mt-1 min-h-28 w-full rounded-md border bg-surface p-3 text-sm" name="description" /></label><Button type="submit">Save activity</Button></form></Card>; }
function ProposalForm({ dealId, onSubmit }: { dealId: string; onSubmit: (body: object) => Promise<boolean> }) { return <Card className="p-5"><h2 className="font-semibold">Create proposal version</h2><form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await onSubmit({ title: form.get("title"), summary: form.get("summary") || null, amount: form.get("amount") || null, currency: "IDR", documentUrl: form.get("documentUrl") || null, dealId }); }}><label className="text-sm sm:col-span-2">Title<Input className="mt-1" name="title" required /></label><label className="text-sm sm:col-span-2">Summary<textarea className="mt-1 min-h-28 w-full rounded-md border bg-surface p-3 text-sm" name="summary" /></label><label className="text-sm">Amount<Input className="mt-1" min="0" name="amount" type="number" /></label><label className="text-sm">Document URL<Input className="mt-1" name="documentUrl" type="url" /></label><div className="sm:col-span-2"><Button type="submit">Create draft</Button></div></form></Card>; }
function LostForm({ onSubmit }: { onSubmit: (reason: string) => Promise<boolean> }) { return <Card className="border-danger-100 p-5"><h2 className="font-semibold">Mark Deal Lost</h2><form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await onSubmit(String(form.get("reason"))); }}><Input name="reason" placeholder="Alasan Deal tidak dilanjutkan" required /><Button className="bg-danger-600 hover:bg-danger-700" type="submit">Confirm Lost</Button></form></Card>; }
function WonForm({ defaultValue, onSubmit }: { defaultValue: string | null; onSubmit: (value: string | null) => Promise<boolean> }) { return <Card className="border-success-100 p-5"><h2 className="font-semibold">Mark Deal Won</h2><form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await onSubmit(form.get("finalValue") ? String(form.get("finalValue")) : null); }}><Input defaultValue={defaultValue ?? ""} min="0" name="finalValue" placeholder="Final value" type="number" /><Button type="submit">Confirm Won</Button></form></Card>; }
function DealEditForm({ deal, onSubmit }: { deal: DealData; onSubmit: (body: object) => Promise<boolean> }) { return <Card className="p-5"><h2 className="font-semibold">Edit Deal</h2><form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); await onSubmit({ title: form.get("title"), estimatedValue: form.get("estimatedValue") || null, probability: Number(form.get("probability")), expectedCloseDate: form.get("expectedCloseDate") ? new Date(String(form.get("expectedCloseDate"))).toISOString() : null }); }}><label className="text-sm sm:col-span-2">Title<Input className="mt-1" defaultValue={deal.title} name="title" /></label><label className="text-sm">Estimated value<Input className="mt-1" defaultValue={deal.estimatedValue ?? ""} min="0" name="estimatedValue" type="number" /></label><label className="text-sm">Probability<Input className="mt-1" defaultValue={deal.probability} max="100" min="0" name="probability" type="number" /></label><label className="text-sm">Expected close<Input className="mt-1" name="expectedCloseDate" type="date" /></label><div className="sm:col-span-2"><Button type="submit">Save Deal</Button></div></form></Card>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-text-muted">{label}</p><p className="mt-1 break-words text-sm font-semibold tabular-nums">{value}</p></div>; }
function ViewLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) { return <Link className={cn("rounded-md px-3 py-2 text-sm font-semibold", active ? "bg-brand-50 text-brand-700" : "text-text-secondary hover:bg-surface-subtle")} href={href}>{children}</Link>; }
