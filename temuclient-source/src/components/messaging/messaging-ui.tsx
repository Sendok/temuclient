"use client";

import { ArrowLeft, CornerUpLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type {
  ConversationData,
  ConversationListData,
  MessageListData,
} from "@/modules/conversations/service";
import { useConversationPolling } from "@/modules/conversations/use-conversation-polling";

export function MessagingWorkspace({
  conversations,
  conversation,
  messages,
  currentUserId,
  explicitlySelected,
}: {
  conversations: ConversationListData;
  conversation?: ConversationData;
  messages?: MessageListData;
  currentUserId: string;
  explicitlySelected: boolean;
}) {
  useConversationPolling(Boolean(conversation));
  if (!conversations.items.length)
    return (
      <div className="space-y-7">
        <PageHeader title="Messages" description="Percakapan bisnis yang telah memperoleh persetujuan kedua pihak." />
        <EmptyState
          title="Belum ada percakapan"
          description="Percakapan akan tersedia otomatis setelah Buyer menerima Introduction."
          action={<Link className="text-sm font-semibold text-brand-700" href="/app/introductions">Lihat Introductions →</Link>}
        />
      </div>
    );
  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="Diskusi langsung dalam relasi bisnis yang sudah terverifikasi." />
      <Card className="min-h-[660px] overflow-hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)_260px]">
        <ConversationList
          className={cn(explicitlySelected && "hidden lg:block")}
          conversations={conversations}
          selectedId={conversation?.id}
        />
        {conversation && messages ? (
          <ConversationThread
            className={cn(!explicitlySelected && "hidden lg:flex")}
            conversation={conversation}
            currentUserId={currentUserId}
            messages={messages}
          />
        ) : (
          <div className="hidden items-center justify-center p-8 text-sm text-text-muted lg:flex">Pilih percakapan untuk mulai berdiskusi.</div>
        )}
        {conversation ? <ContextPanel className="hidden lg:block" conversation={conversation} /> : null}
      </Card>
    </div>
  );
}

function ConversationList({ conversations, selectedId, className }: { conversations: ConversationListData; selectedId?: string; className?: string }) {
  return (
    <aside className={cn("border-r", className)}>
      <div className="border-b px-4 py-4"><h2 className="font-semibold">Percakapan</h2><p className="mt-1 text-xs text-text-muted">{conversations.items.length} koneksi aktif</p></div>
      <div className="divide-y">
        {conversations.items.map((item) => (
          <Link
            className={cn("block px-4 py-4 transition hover:bg-surface-subtle", selectedId === item.id && "bg-brand-50")}
            href={`/app/messages?conversation=${item.id}`}
            key={item.id}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold">{item.counterpart?.organization.name ?? "Connected company"}</p>
              {item.unreadCount ? <Badge tone="brand">{item.unreadCount}</Badge> : null}
            </div>
            <p className="mt-1 truncate text-xs text-text-secondary">{item.opportunity?.title ?? "Introduction conversation"}</p>
            <p className="mt-2 truncate text-xs text-text-muted">{item.lastMessage?.body ?? "Belum ada pesan"}</p>
          </Link>
        ))}
      </div>
    </aside>
  );
}

function ConversationThread({ conversation, messages, currentUserId, className }: { conversation: ConversationData; messages: MessageListData; currentUserId: string; className?: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [reply, setReply] = useState<MessageListData["items"][number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/v1/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, replyToId: reply?.id ?? null }),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) { setError(payload.error?.message ?? "Pesan gagal dikirim."); return; }
    setBody(""); setReply(null); router.refresh();
  }
  return (
    <section className={cn("min-w-0 flex-col", className)}>
      <header className="flex min-h-16 items-center gap-3 border-b px-4">
        <Link aria-label="Kembali ke daftar percakapan" className="lg:hidden" href="/app/messages"><ArrowLeft className="size-5" /></Link>
        <div><h2 className="text-sm font-semibold">{conversation.counterpart?.organization.name}</h2><p className="text-xs text-text-muted">{conversation.opportunity?.title}</p></div>
      </header>
      <div aria-live="polite" className="flex min-h-[470px] flex-1 flex-col justify-end gap-3 overflow-y-auto bg-surface-subtle/40 p-4">
        {!messages.items.length ? <p className="m-auto text-sm text-text-muted">Mulai percakapan dengan konteks yang jelas.</p> : null}
        {messages.items.map((message) => {
          const mine = message.sender.id === currentUserId;
          return (
            <div className={cn("group flex", mine ? "justify-end" : "justify-start")} key={message.id}>
              <div className={cn("max-w-[82%] rounded-lg border px-3 py-2 text-sm", mine ? "border-brand-600 bg-brand-600 text-white" : "bg-surface")}>
                {!mine ? <p className="mb-1 text-xs font-semibold text-text-secondary">{message.sender.name}</p> : null}
                {message.replyTo ? <div className={cn("mb-2 border-l-2 pl-2 text-xs opacity-75", mine ? "border-white" : "border-brand-500")}>{message.replyTo.senderName}: {message.replyTo.body}</div> : null}
                <p className="whitespace-pre-wrap break-words leading-6">{message.body}</p>
                <div className="mt-1 flex items-center justify-end gap-2 text-[10px] opacity-70">
                  <time>{new Date(message.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}</time>
                  {message.editedAt ? <span>edited</span> : null}
                  <button aria-label="Balas pesan" className="opacity-70 hover:opacity-100" onClick={() => setReply(message)}><CornerUpLeft className="size-3" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form className="border-t p-3" onSubmit={submit}>
        {reply ? <div className="mb-2 flex items-center justify-between rounded-md bg-surface-subtle px-3 py-2 text-xs"><span className="truncate">Balas {reply.sender.name}: {reply.body}</span><button onClick={() => setReply(null)} type="button">Batal</button></div> : null}
        {error ? <p className="mb-2 text-xs text-danger-700">{error}</p> : null}
        <div className="flex items-end gap-2">
          <textarea aria-label="Tulis pesan" className="min-h-11 flex-1 resize-none rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500" maxLength={4000} onChange={(event) => setBody(event.target.value)} placeholder="Tulis pesan..." rows={2} value={body} />
          <Button aria-label="Kirim pesan" disabled={busy || !body.trim()} type="submit"><Send className="size-4" /></Button>
        </div>
      </form>
    </section>
  );
}

function ContextPanel({ conversation, className }: { conversation: ConversationData; className?: string }) {
  return (
    <aside className={cn("border-l p-5", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Context</p>
      <h3 className="mt-3 text-sm font-semibold">{conversation.opportunity?.title}</h3>
      <p className="mt-2 line-clamp-5 text-xs leading-5 text-text-secondary">{conversation.problemStatement}</p>
      <dl className="mt-5 space-y-4 text-xs">
        <div><dt className="text-text-muted">Company</dt><dd className="mt-1 font-medium">{conversation.counterpart?.organization.name}</dd></div>
        <div><dt className="text-text-muted">Next action</dt><dd className="mt-1 font-medium">{conversation.meeting ? "Siapkan meeting" : "Jadwalkan discovery meeting"}</dd></div>
        {conversation.meeting ? <div><dt className="text-text-muted">Meeting</dt><dd className="mt-1"><Link className="font-medium text-brand-700" href={`/app/meetings/${conversation.meeting.id}`}>{conversation.meeting.title}</Link></dd></div> : null}
      </dl>
      <Link className="mt-6 inline-block text-xs font-semibold text-brand-700" href={`/app/meetings?conversation=${conversation.id}`}>Jadwalkan meeting →</Link>
    </aside>
  );
}
