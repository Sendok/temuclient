"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import type { NotificationListData } from "@/modules/notifications/service";

export function NotificationCenter({ notifications }: { notifications: NotificationListData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function read(path: string) { setBusy(true); await fetch(path, { method: "POST" }); setBusy(false); router.refresh(); }
  return <div className="space-y-6"><PageHeader title="Notifications" description={`${notifications.unreadCount} notifikasi belum dibaca.`} action={notifications.unreadCount ? <Button disabled={busy} onClick={() => read("/api/v1/notifications/read-all")} variant="outline">Mark all as read</Button> : undefined} />{!notifications.items.length ? <EmptyState title="Belum ada notifikasi" description="Pembaruan Introduction, pesan, dan meeting akan muncul di sini." /> : <Card className="divide-y overflow-hidden">{notifications.items.map((item) => <button className={`block w-full px-5 py-4 text-left hover:bg-surface-subtle ${item.readAt ? "opacity-65" : "bg-brand-50/40"}`} disabled={busy} key={item.id} onClick={() => !item.readAt && read(`/api/v1/notifications/${item.id}/read`)}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm text-text-secondary">{item.body}</p></div>{!item.readAt ? <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-600" /> : null}</div><time className="mt-2 block text-xs text-text-muted">{new Date(item.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</time></button>)}</Card>}</div>;
}
