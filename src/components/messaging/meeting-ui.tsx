"use client";

import { CalendarDays, ExternalLink, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/primitives";
import { formatInTimezone } from "@/lib/dates/timezone";
import type { ConversationListData } from "@/modules/conversations/service";
import type { MeetingData, MeetingListData } from "@/modules/meetings/service";

export function MeetingWorkspace({
  meetings,
  conversations,
  view,
  currentUserId,
  meeting,
}: {
  meetings: MeetingListData;
  conversations: ConversationListData;
  view: "upcoming" | "past";
  currentUserId: string;
  meeting?: MeetingData;
}) {
  const [showForm, setShowForm] = useState(false);
  if (meeting)
    return <MeetingDetail currentUserId={currentUserId} meeting={meeting} />;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="Jadwal discovery dan pembahasan bisnis dalam timezone Asia/Jakarta."
        action={conversations.items.length ? <Button onClick={() => setShowForm((value) => !value)}>{showForm ? "Tutup" : "Schedule meeting"}</Button> : undefined}
      />
      {showForm ? <MeetingForm conversations={conversations} onDone={() => setShowForm(false)} /> : null}
      <nav className="flex gap-2 border-b">
        <Link className={`px-3 py-3 text-sm font-semibold ${view === "upcoming" ? "border-b-2 border-brand-600 text-brand-700" : "text-text-secondary"}`} href="/app/meetings?view=upcoming">Upcoming</Link>
        <Link className={`px-3 py-3 text-sm font-semibold ${view === "past" ? "border-b-2 border-brand-600 text-brand-700" : "text-text-secondary"}`} href="/app/meetings?view=past">Past</Link>
      </nav>
      {!meetings.length ? (
        <EmptyState
          title={view === "upcoming" ? "Belum ada meeting mendatang" : "Belum ada riwayat meeting"}
          description={conversations.items.length ? "Jadwalkan meeting dari percakapan Introduction yang sudah diterima." : "Meeting dapat dijadwalkan setelah Introduction diterima."}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {meetings.map((item) => <MeetingCard item={item} key={item.id} />)}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ item }: { item: MeetingListData[number] }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-text-muted">{item.opportunity?.title}</p><Link className="mt-1 block font-semibold hover:text-brand-700" href={`/app/meetings/${item.id}`}>{item.title}</Link></div><Badge tone={item.status === "SCHEDULED" ? "brand" : item.status === "COMPLETED" ? "success" : "neutral"}>{item.status}</Badge></div>
      <div className="mt-5 space-y-2 text-sm text-text-secondary">
        <p className="flex items-center gap-2"><CalendarDays className="size-4" />{formatInTimezone(item.startsAt, item.timezone)} – {new Date(item.endsAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: item.timezone })}</p>
        <p className="flex items-center gap-2"><Users className="size-4" />{item.participants.map((participant) => participant.name).join(", ")}</p>
      </div>
      <div className="mt-5 flex gap-3">
        <Link className="text-sm font-semibold text-brand-700" href={`/app/meetings/${item.id}`}>View details</Link>
        <Link className="text-sm font-semibold text-brand-700" href={`/app/meetings/${item.id}/prepare`}>Prepare with AI</Link>
        {item.status === "SCHEDULED" && item.meetingUrl ? <a className="flex items-center gap-1 text-sm font-semibold text-brand-700" href={item.meetingUrl} rel="noreferrer" target="_blank">Join <ExternalLink className="size-3" /></a> : null}
      </div>
    </Card>
  );
}

function MeetingForm({ conversations, onDone }: { conversations: ConversationListData; onDone: () => void }) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState(conversations.items[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = conversations.items.find((item) => item.id === conversationId) ?? conversations.items[0];
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    const response = await fetch("/api/v1/meetings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        opportunityId: selected?.opportunity?.id,
        introductionId: selected?.introductionId,
        startsAt: new Date(String(form.get("startsAt"))).toISOString(),
        endsAt: new Date(String(form.get("endsAt"))).toISOString(),
        timezone: form.get("timezone"),
        meetingProvider: form.get("meetingProvider") || null,
        meetingUrl: form.get("meetingUrl") || null,
      }),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) { setError(payload.error?.message ?? "Meeting gagal dijadwalkan."); return; }
    onDone(); router.push(`/app/meetings/${payload.data.id}`); router.refresh();
  }
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Schedule discovery meeting</h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-sm sm:col-span-2">Conversation<Select className="mt-1 w-full" onChange={(event) => setConversationId(event.target.value)} value={conversationId}>{conversations.items.map((item) => <option key={item.id} value={item.id}>{item.opportunity?.title} · {item.counterpart?.organization.name}</option>)}</Select></label>
        <label className="text-sm sm:col-span-2">Title<Input className="mt-1" defaultValue="Discovery Meeting" name="title" required /></label>
        <label className="text-sm">Starts at<Input className="mt-1" name="startsAt" required type="datetime-local" /></label>
        <label className="text-sm">Ends at<Input className="mt-1" name="endsAt" required type="datetime-local" /></label>
        <label className="text-sm">Timezone<Input className="mt-1" defaultValue="Asia/Jakarta" name="timezone" required /></label>
        <label className="text-sm">Provider<Select className="mt-1 w-full" defaultValue="GOOGLE_MEET" name="meetingProvider"><option value="GOOGLE_MEET">Google Meet</option><option value="ZOOM">Zoom</option><option value="MICROSOFT_TEAMS">Microsoft Teams</option><option value="OTHER">Other</option></Select></label>
        <label className="text-sm sm:col-span-2">Meeting URL<Input className="mt-1" name="meetingUrl" placeholder="https://meet.google.com/..." type="url" /></label>
        {error ? <p className="text-sm text-danger-700 sm:col-span-2">{error}</p> : null}
        <div className="sm:col-span-2"><Button disabled={busy} type="submit">{busy ? "Scheduling..." : "Schedule meeting"}</Button></div>
      </form>
    </Card>
  );
}

function MeetingDetail({ meeting, currentUserId }: { meeting: MeetingData; currentUserId: string }) {
  const router = useRouter();
  const [reschedule, setReschedule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canManage = meeting.createdBy.id === currentUserId && meeting.status === "SCHEDULED";
  async function mutate(path: string, method: "POST" | "PATCH", body?: object) {
    setBusy(true); setError("");
    const response = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { setError(payload.error?.message ?? "Meeting gagal diperbarui."); return; }
    setReschedule(false); router.refresh();
  }
  async function submitReschedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await mutate(`/api/v1/meetings/${meeting.id}`, "PATCH", { startsAt: new Date(String(form.get("startsAt"))).toISOString(), endsAt: new Date(String(form.get("endsAt"))).toISOString(), timezone: form.get("timezone"), meetingUrl: form.get("meetingUrl") || null });
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Meeting" title={meeting.title} description={meeting.opportunity?.title} action={<Badge tone={meeting.status === "SCHEDULED" ? "brand" : meeting.status === "COMPLETED" ? "success" : "neutral"}>{meeting.status}</Badge>} />
      <Link className="text-sm font-semibold text-brand-700" href="/app/meetings">← Back to meetings</Link>
      <Card className="grid gap-6 p-6 md:grid-cols-2">
        <Detail label="Start" value={formatInTimezone(meeting.startsAt, meeting.timezone)} />
        <Detail label="End" value={formatInTimezone(meeting.endsAt, meeting.timezone)} />
        <Detail label="Timezone" value={meeting.timezone} />
        <Detail label="Provider" value={meeting.meetingProvider ?? "Not specified"} />
        <div className="md:col-span-2"><Detail label="Participants" value={meeting.participants.map((item) => `${item.name} (${item.role ?? "Participant"})`).join(", ")} /></div>
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Link href={`/app/meetings/${meeting.id}/prepare`}><Button variant="outline">Prepare with AI</Button></Link>
          {meeting.status === "SCHEDULED" && meeting.meetingUrl ? <a href={meeting.meetingUrl} rel="noreferrer" target="_blank"><Button>Join meeting</Button></a> : null}
          {canManage ? <Button onClick={() => setReschedule((value) => !value)} variant="outline">Reschedule</Button> : null}
          {canManage ? <Button disabled={busy} onClick={() => mutate(`/api/v1/meetings/${meeting.id}`, "PATCH", { status: "COMPLETED" })} variant="outline">Mark completed</Button> : null}
          {canManage ? <Button className="border-danger-200 text-danger-700" disabled={busy} onClick={() => mutate(`/api/v1/meetings/${meeting.id}/cancel`, "POST")} variant="outline">Cancel meeting</Button> : null}
        </div>
      </Card>
      {error ? <p className="text-sm text-danger-700">{error}</p> : null}
      {reschedule ? <Card className="p-5"><form className="grid gap-4 sm:grid-cols-2" onSubmit={submitReschedule}><label className="text-sm">New start<Input className="mt-1" name="startsAt" required type="datetime-local" /></label><label className="text-sm">New end<Input className="mt-1" name="endsAt" required type="datetime-local" /></label><label className="text-sm">Timezone<Input className="mt-1" defaultValue={meeting.timezone} name="timezone" required /></label><label className="text-sm">Meeting URL<Input className="mt-1" defaultValue={meeting.meetingUrl ?? ""} name="meetingUrl" type="url" /></label><div className="sm:col-span-2"><Button disabled={busy} type="submit">Save new schedule</Button></div></form></Card> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>; }
