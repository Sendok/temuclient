"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import type { listAdminArticles } from "@/modules/articles/service";

export function ArticleAdmin({ articles, canUpload }: { articles: Awaited<ReturnType<typeof listAdminArticles>>; canUpload: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string }>();

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(undefined);
    const response = await fetch("/api/v1/admin/articles", { method: "POST", body: new FormData(event.currentTarget) });
    const payload = await response.json();
    if (!response.ok) setMessage({ tone: "error", text: payload.error?.message ?? "Artikel gagal diunggah." });
    else {
      setMessage({ tone: "success", text: `${payload.data.title} tersimpan sebagai ${payload.data.status}.` });
      event.currentTarget.reset(); router.refresh();
    }
    setBusy(false);
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Content operations" title="Artikel & Insight" description="Unggah Markdown tervalidasi untuk publikasi SEO/GEO. Slug yang sama akan memperbarui artikel dan tetap tercatat di audit log." />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section>
        {articles.length ? <div className="overflow-hidden rounded-lg border bg-surface"><div className="divide-y">{articles.map((article) => <div className="flex flex-wrap items-center justify-between gap-4 p-4" key={article.id}><div><div className="flex items-center gap-2"><p className="font-semibold">{article.title}</p><Badge tone={article.status === "PUBLISHED" ? "success" : article.status === "ARCHIVED" ? "warning" : "neutral"}>{article.status}</Badge></div><p className="mt-1 text-xs text-text-muted">/{article.slug} • {article.category} • diperbarui {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(article.updatedAt))}</p></div>{article.status === "PUBLISHED" && <Link className="text-sm font-semibold text-brand-700" href={`/insight/${article.slug}`} target="_blank">Lihat artikel →</Link>}</div>)}</div></div> : <EmptyState title="Belum ada artikel" description="Unggah file Markdown pertama melalui panel di samping." />}
      </section>
      <aside className="space-y-4">
        <Card className="p-5"><h2 className="font-semibold">Unggah `.md`</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Maksimal 500 KB. Hanya SUPER_ADMIN dan ADMIN yang dapat mengubah konten.</p>{canUpload ? <form className="mt-5 space-y-4" onSubmit={upload}><input accept=".md,.markdown,text/markdown" className="block w-full rounded-md border bg-surface p-3 text-sm" name="file" required type="file" /><Button className="w-full" disabled={busy} type="submit">{busy ? "Mengunggah…" : "Validasi & unggah"}</Button></form> : <p className="mt-4 rounded-md bg-warning-50 p-3 text-sm text-warning-700">Role MODERATOR hanya dapat melihat daftar artikel.</p>}{message && <p aria-live="polite" className={`mt-4 rounded-md p-3 text-sm ${message.tone === "success" ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"}`}>{message.text}</p>}</Card>
        <Card className="p-5"><h2 className="font-semibold">Frontmatter wajib</h2><pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-surface-muted p-3 text-xs leading-5">{`---\ntitle: Cara Memilih Vendor ERP\ndescription: Panduan praktis memilih vendor ERP berdasarkan kebutuhan bisnis, kapabilitas, dan bukti implementasi.\nslug: cara-memilih-vendor-erp\nauthor: Tim TemuClient\ncategory: Procurement Teknologi\ntags: ERP, Vendor Selection\nkeywords: vendor ERP Indonesia, memilih vendor ERP\nstatus: DRAFT\n---\n\nParagraf pembuka minimal 200 karakter.\n\n## Pembahasan utama`}</pre></Card>
      </aside>
    </div>
  </div>;
}
