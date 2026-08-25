"use client";

import { BrainCircuit, CalendarCheck, FileText, HeartPulse, Mail, SearchCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader, Select } from "@/components/ui/primitives";
import type { MeetingData } from "@/modules/meetings/service";
import type { AISalesContext } from "@/modules/ai/sales-service";

const taskCards = [
  { id: "meeting-prep", label: "Meeting Prep", description: "Siapkan agenda discovery dan pertanyaan yang relevan.", icon: CalendarCheck },
  { id: "opportunity-analysis", label: "Opportunity Analysis", description: "Ringkas kebutuhan dan jelaskan Match Score deterministik.", icon: SearchCheck },
  { id: "discovery-analysis", label: "Discovery Analysis", description: "Ubah catatan meeting menjadi sinyal dan next action.", icon: BrainCircuit },
  { id: "follow-up", label: "Follow-Up", description: "Buat draft tindak lanjut yang wajib Anda review.", icon: Mail },
  { id: "proposal-outline", label: "Proposal Outline", description: "Susun kerangka proposal tanpa membuat atau mengirimnya.", icon: FileText },
  { id: "deal-coach", label: "Deal Coach", description: "Tinjau Deal Health, risiko, dan next best action.", icon: HeartPulse },
] as const;

type TaskId = (typeof taskCards)[number]["id"];
type AIResponse = Record<string, unknown> & {
  assistance?: { mode: string; provider: string; model: string; generatedAt: string; notice: string };
};

export function AISalesWorkspace({
  context,
  initialTask = "meeting-prep",
  initialEntityId,
}: {
  context: AISalesContext;
  initialTask?: string;
  initialEntityId?: string;
}) {
  const task = taskCards.some((item) => item.id === initialTask)
    ? (initialTask as TaskId)
    : "meeting-prep";
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Contextual assistance"
        title="AI Sales"
        description="Bantuan terstruktur untuk pekerjaan sales nyata. Setiap output adalah inferensi atau draft yang wajib ditinjau."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {taskCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link href={`/app/ai-sales?task=${item.id}`} key={item.id}>
              <Card className={`h-full p-4 transition-colors hover:border-brand-500 ${task === item.id ? "border-brand-500 bg-brand-50" : ""}`}>
                <Icon className="size-5 text-brand-700" />
                <h2 className="mt-3 text-sm font-semibold">{item.label}</h2>
                <p className="mt-1 text-xs leading-5 text-text-secondary">{item.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
      <TaskWorkspace context={context} initialEntityId={initialEntityId} task={task} />
      <RecentExecutions executions={context.executions} />
    </div>
  );
}

function TaskWorkspace({ context, task, initialEntityId }: { context: AISalesContext; task: TaskId; initialEntityId?: string }) {
  if (task === "opportunity-analysis")
    return <OpportunityTask context={context} initialEntityId={initialEntityId} />;
  if (task === "meeting-prep")
    return <MeetingTask context={context} initialEntityId={initialEntityId} />;
  if (task === "discovery-analysis")
    return <DiscoveryTask context={context} initialEntityId={initialEntityId} />;
  if (task === "follow-up") return <FollowUpTask context={context} initialEntityId={initialEntityId} />;
  if (task === "proposal-outline") return <ProposalTask context={context} initialEntityId={initialEntityId} />;
  return <DealHealthTask context={context} initialEntityId={initialEntityId} />;
}

function OpportunityTask({ context, initialEntityId }: { context: AISalesContext; initialEntityId?: string }) {
  const request = useAIRequest();
  const [id, setId] = useState(validInitial(initialEntityId, context.opportunities.map((item) => item.opportunityId)) ?? context.opportunities[0]?.opportunityId ?? "");
  if (!context.opportunities.length)
    return <EmptyState title="Belum ada Opportunity untuk dianalisis" description="Opportunity harus memiliki Match untuk organisasi Provider Anda." action={<Link className="font-semibold text-brand-700" href="/app/opportunities">Lihat Opportunity →</Link>} />;
  return (
    <TaskCard title="Opportunity Analysis" description="Konteks yang dikirim hanya menggunakan DTO Provider-safe; identitas dan kontak Buyer tetap mengikuti privacy gate.">
      <EntitySelect label="Opportunity" onChange={setId} value={id}>{context.opportunities.map((item) => <option key={item.opportunityId} value={item.opportunityId}>{item.opportunity.title} · Match {item.totalScore}%</option>)}</EntitySelect>
      <div className="flex flex-wrap gap-2">
        <Button disabled={request.busy} onClick={() => request.run("/api/v1/ai/opportunity-summary", { opportunityId: id })}>Generate Summary</Button>
        <Button disabled={request.busy} onClick={() => request.run("/api/v1/ai/match-explanation", { opportunityId: id })} variant="outline">Explain Match</Button>
      </div>
      <RequestState request={request} />
    </TaskCard>
  );
}

function MeetingTask({ context, initialEntityId }: { context: AISalesContext; initialEntityId?: string }) {
  const request = useAIRequest();
  const [id, setId] = useState(validInitial(initialEntityId, context.meetings.map((item) => item.id)) ?? context.meetings[0]?.id ?? "");
  if (!context.meetings.length)
    return <EmptyState title="Belum ada Meeting" description="Meeting Prep tersedia setelah Anda menjadi participant pada Meeting yang terhubung." action={<Link className="font-semibold text-brand-700" href="/app/meetings">Buka Meetings →</Link>} />;
  return (
    <TaskCard title="Meeting Prep" description="Siapkan discovery dengan konteks Opportunity, counterpart, stakeholder, dan portfolio yang berhak Anda akses.">
      <EntitySelect label="Meeting" onChange={setId} value={id}>{context.meetings.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.status}</option>)}</EntitySelect>
      <div><Button disabled={request.busy} onClick={() => request.run("/api/v1/ai/meeting-prep", { meetingId: id })}>{request.busy ? "Preparing..." : "Prepare with AI"}</Button></div>
      <RequestState request={request} />
    </TaskCard>
  );
}

function DiscoveryTask({ context, initialEntityId }: { context: AISalesContext; initialEntityId?: string }) {
  const request = useAIRequest();
  const [id, setId] = useState(validInitial(initialEntityId, context.meetings.map((item) => item.id)) ?? context.meetings[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  if (!context.meetings.length)
    return <EmptyState title="Belum ada Meeting untuk discovery" description="Buat Meeting dari Introduction yang diterima terlebih dahulu." />;
  return (
    <TaskCard title="Discovery Analysis" description="Catatan Anda tidak disimpan sebagai raw prompt di AIExecution.">
      <EntitySelect label="Meeting" onChange={setId} value={id}>{context.meetings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</EntitySelect>
      <TextArea label="Meeting notes" onChange={setNotes} placeholder="Tuliskan pain point, stakeholder, budget, timeline, objection, dan next step yang benar-benar dibahas..." value={notes} />
      <div><Button disabled={request.busy || notes.trim().length < 20} onClick={() => request.run("/api/v1/ai/discovery-analysis", { meetingId: id, notes })}>Analyze Discovery</Button></div>
      <RequestState request={request} />
    </TaskCard>
  );
}

function FollowUpTask({ context, initialEntityId }: { context: AISalesContext; initialEntityId?: string }) {
  const request = useAIRequest();
  const [id, setId] = useState(validInitial(initialEntityId, context.conversations.map((item) => item.id)) ?? context.conversations[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [tone, setTone] = useState("PROFESSIONAL");
  if (!context.conversations.length)
    return <EmptyState title="Belum ada Conversation" description="Follow-Up tersedia hanya pada Conversation dari Introduction yang diterima." />;
  return (
    <TaskCard title="Follow-Up Draft" description="TemuClient tidak mengirim draft ini. Anda harus meninjau, mengedit, dan memilih sendiri saluran pengiriman.">
      <EntitySelect label="Conversation" onChange={setId} value={id}>{context.conversations.map((item) => <option key={item.id} value={item.id}>{item.opportunity?.title ?? "Conversation"}</option>)}</EntitySelect>
      <EntitySelect label="Tone" onChange={setTone} value={tone}><option value="PROFESSIONAL">Professional</option><option value="CONCISE">Concise</option><option value="CONSULTATIVE">Consultative</option></EntitySelect>
      <TextArea label="Context tambahan (opsional)" onChange={setNotes} placeholder="Ringkasan pembahasan dan next step yang ingin dimasukkan..." value={notes} />
      <div><Button disabled={request.busy} onClick={() => request.run("/api/v1/ai/follow-up", { conversationId: id, notes, tone })}>Generate Draft</Button></div>
      <RequestState draft request={request} />
    </TaskCard>
  );
}

function ProposalTask({ context, initialEntityId }: { context: AISalesContext; initialEntityId?: string }) {
  const request = useAIRequest();
  const manageable = context.deals.filter((item) => item.status === "OPEN" && item.canManage);
  const [id, setId] = useState(validInitial(initialEntityId, manageable.map((item) => item.id)) ?? manageable[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  if (!manageable.length)
    return <EmptyState title="Belum ada Deal aktif" description="Proposal Outline membutuhkan Deal aktif yang dapat Anda kelola." />;
  return (
    <TaskCard title="Proposal Outline" description="Output tidak membuat Proposal record dan tidak pernah disubmit otomatis.">
      <EntitySelect label="Deal" onChange={setId} value={id}>{manageable.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.stage}</option>)}</EntitySelect>
      <TextArea label="Konteks tambahan (opsional)" onChange={setNotes} placeholder="Batas scope, deliverable, asumsi, atau commercial structure..." value={notes} />
      <div><Button disabled={request.busy} onClick={() => request.run("/api/v1/ai/proposal-outline", { dealId: id, notes })}>Generate Outline</Button></div>
      <RequestState draft request={request} />
    </TaskCard>
  );
}

function DealHealthTask({ context, initialEntityId }: { context: AISalesContext; initialEntityId?: string }) {
  const request = useAIRequest();
  const [id, setId] = useState(validInitial(initialEntityId, context.deals.map((item) => item.id)) ?? context.deals[0]?.id ?? "");
  if (!context.deals.length)
    return <EmptyState title="Belum ada Deal" description="Deal Coach tersedia setelah Introduction diterima dan Deal dibuat." />;
  return (
    <TaskCard title="Deal Coach" description="Deal Health adalah indikator bantuan berdasarkan data tersedia, bukan kepastian hasil komersial.">
      <EntitySelect label="Deal" onChange={setId} value={id}>{context.deals.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.stage}</option>)}</EntitySelect>
      <div><Button disabled={request.busy} onClick={() => request.run("/api/v1/ai/deal-health", { dealId: id })}>Analyze Deal Health</Button></div>
      <RequestState request={request} />
    </TaskCard>
  );
}

export function MeetingPrepPage({ meeting }: { meeting: MeetingData }) {
  const request = useAIRequest();
  return (
    <div className="space-y-6">
      <Link className="text-sm font-semibold text-brand-700" href={`/app/meetings/${meeting.id}`}>← Kembali ke Meeting</Link>
      <PageHeader eyebrow="AI Meeting Prep" title={meeting.title} description="Persiapan kontekstual untuk discovery. Tinjau seluruh inferensi sebelum meeting." />
      <Card className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div><p className="text-sm font-semibold">{meeting.opportunity?.title ?? "Meeting context"}</p><p className="mt-1 text-xs text-text-secondary">{meeting.participants.map((item) => item.name).join(", ")}</p></div>
        <Button disabled={request.busy} onClick={() => request.run("/api/v1/ai/meeting-prep", { meetingId: meeting.id })}>{request.busy ? "Preparing..." : request.result ? "Regenerate Prep" : "Prepare with AI"}</Button>
      </Card>
      {!request.result && !request.error ? <EmptyState title="Prep belum dibuat" description="Generate prep saat Anda siap. Data Meeting dan Opportunity tidak berubah." /> : null}
      <RequestState request={request} />
    </div>
  );
}

function useAIRequest() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AIResponse | null>(null);
  async function run(path: string, body: object) {
    setBusy(true); setError("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) { setError(payload.error?.message ?? "AI belum dapat memproses permintaan."); return; }
      setResult(payload.data);
    } catch {
      setError("Koneksi ke AI terputus. Input tetap ada; silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, result, run };
}

function RequestState({ request, draft = false }: { request: ReturnType<typeof useAIRequest>; draft?: boolean }) {
  if (request.error)
    return <Card className="border-danger-100 bg-danger-50 p-4"><p className="text-sm font-semibold text-danger-700">AI belum tersedia</p><p className="mt-1 text-sm text-text-secondary">{request.error}</p><p className="mt-2 text-xs text-text-muted">Input Anda tetap ada. Periksa konteks lalu coba kembali.</p></Card>;
  if (!request.result) return null;
  return draft ? <EditableDraft key={JSON.stringify(request.result)} result={request.result} /> : <StructuredResult result={request.result} />;
}

function StructuredResult({ result }: { result: AIResponse }) {
  const entries = Object.entries(result).filter(([key]) => key !== "assistance");
  return (
    <div className="space-y-3">
      <AssistanceBanner assistance={result.assistance} />
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map(([key, value]) => <ResultSection key={key} label={humanize(key)} value={value} />)}
      </div>
    </div>
  );
}

function EditableDraft({ result }: { result: AIResponse }) {
  const initial = useMemo(() => Object.entries(result).filter(([key]) => !["assistance", "requiresReview", "reviewChecklist"].includes(key)).map(([key, value]) => `${humanize(key)}\n${Array.isArray(value) ? value.map((item) => `- ${String(item)}`).join("\n") : String(value)}`).join("\n\n"), [result]);
  const [draft, setDraft] = useState(initial);
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-3">
      <AssistanceBanner assistance={result.assistance} />
      <label className="block text-sm font-medium">Editable draft<textarea className="mt-2 min-h-80 w-full rounded-md border bg-surface p-4 text-sm leading-6" onChange={(event) => setDraft(event.target.value)} value={draft} /></label>
      <div className="flex flex-wrap items-center gap-3"><Button onClick={async () => { await navigator.clipboard.writeText(draft); setCopied(true); }} variant="outline">Copy reviewed draft</Button><span className="text-xs text-text-muted">{copied ? "Draft copied." : "Tidak ada aksi kirim otomatis."}</span></div>
    </div>
  );
}

function ResultSection({ label, value }: { label: string; value: unknown }) {
  return <Card className="p-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</h3>{Array.isArray(value) ? <ul className="mt-3 space-y-2 text-sm text-text-secondary">{value.map((item, index) => <li className="flex gap-2" key={`${String(item)}-${index}`}><span className="text-brand-600">•</span><span>{String(item)}</span></li>)}</ul> : <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{String(value)}</p>}</Card>;
}

function AssistanceBanner({ assistance }: { assistance?: AIResponse["assistance"] }) {
  if (!assistance) return null;
  return <Card className="border-brand-100 bg-brand-50 p-4"><div className="flex flex-wrap items-center gap-2"><Badge tone={assistance.mode === "fallback" ? "warning" : "brand"}>{assistance.mode === "fallback" ? "Contextual fallback" : "AI assistance"}</Badge><span className="text-xs text-text-muted">{assistance.provider} · {assistance.model}</span></div><p className="mt-2 text-sm text-text-secondary">{assistance.notice}</p></Card>;
}

function TaskCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card className="space-y-5 p-5 sm:p-6"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">{description}</p></div>{children}</Card>;
}

function EntitySelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="block max-w-2xl text-sm font-medium">{label}<Select className="mt-2 w-full" onChange={(event) => onChange(event.target.value)} value={value}>{children}</Select></label>;
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block text-sm font-medium">{label}<textarea className="mt-2 min-h-36 w-full rounded-md border bg-surface p-3 text-sm leading-6" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>;
}

function RecentExecutions({ executions }: { executions: AISalesContext["executions"] }) {
  return <section><h2 className="text-sm font-semibold">Recent AI activity</h2>{executions.length ? <Card className="mt-3 divide-y">{executions.map((item) => <div className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center" key={item.id}><div><p className="text-sm font-medium">{humanize(item.feature)}</p><p className="mt-1 text-xs text-text-muted">{item.provider} · {item.model} · {new Date(item.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</p></div><Badge tone={item.status === "SUCCESS" ? "success" : "danger"}>{item.status}</Badge></div>)}</Card> : <p className="mt-2 text-sm text-text-secondary">Belum ada AIExecution untuk user ini.</p>}</section>;
}

function validInitial(initial: string | undefined, ids: string[]) { return initial && ids.includes(initial) ? initial : undefined; }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase()); }
