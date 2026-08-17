import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/articles/json-ld";
import { MarketingFooter, MarketingNav } from "@/components/prototype/marketing-prototype";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { getServerEnv } from "@/lib/env";
import { listPublishedArticles } from "@/modules/articles/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Insight B2B, Buyer Intent, dan Pemilihan Vendor",
  description: "Panduan berbasis bukti untuk buyer dan provider B2B Indonesia: requirement, qualification, matching, introduction, meeting, dan deal.",
  alternates: { canonical: "/insight" },
  openGraph: { title: "Insight B2B TemuClient", description: "Panduan praktis untuk keputusan buyer dan provider B2B yang lebih berkualitas.", url: "/insight", type: "website" },
};

function date(value: Date | null) { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(value) : ""; }

export default async function InsightPage() {
  const articles = await listPublishedArticles();
  const baseUrl = getServerEnv().APP_URL;
  return <div><JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Insight B2B TemuClient", description: metadata.description, url: `${baseUrl}/insight`, mainEntity: { "@type": "ItemList", itemListElement: articles.map((article, index) => ({ "@type": "ListItem", position: index + 1, url: `${baseUrl}/insight/${article.slug}`, name: article.title })) } }} /><MarketingNav/><main><header className="border-b bg-surface"><div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">TemuClient Insight</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight">Keputusan B2B yang lebih jernih, dari need sampai deal.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary">Panduan praktis untuk menyusun requirement, menilai provider, membaca buyer intent, dan mengelola proses komersial berbasis evidence.</p></div></header><section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">{articles.length ? <div className="divide-y border-y">{articles.map((article) => <article className="grid gap-4 py-8 sm:grid-cols-[1fr_auto]" key={article.id}><div><div className="flex flex-wrap items-center gap-2"><Badge tone="brand">{article.category}</Badge><span className="text-xs text-text-muted">{article.readingTimeMinutes} menit baca</span></div><h2 className="mt-4 text-2xl font-semibold tracking-tight"><Link className="hover:text-brand-700" href={`/insight/${article.slug}`}>{article.title}</Link></h2><p className="mt-3 max-w-3xl leading-7 text-text-secondary">{article.description}</p><div className="mt-4 flex flex-wrap gap-2">{article.tags.map((tag) => <span className="text-xs text-text-muted" key={tag}>#{tag.replace(/\s+/g, "")}</span>)}</div></div><p className="text-sm text-text-muted sm:text-right">{date(article.publishedAt)}<br />{article.authorName}</p></article>)}</div> : <EmptyState title="Insight segera hadir" description="Artikel yang telah melewati review editorial akan muncul di halaman ini." />}</section></main><MarketingFooter/></div>;
}
