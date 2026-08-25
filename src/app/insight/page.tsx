import type { Metadata } from "next";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import Link from "next/link";

import { JsonLd } from "@/components/articles/json-ld";
import { MarketingFooter, MarketingNav } from "@/components/marketing/site-shell";
import { EmptyState } from "@/components/ui/primitives";
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
  const [featured, ...remaining] = articles;
  const categories = [...new Set(articles.map((article) => article.category))].slice(0, 6);
  return <div className="marketing-theme bg-white text-[#071518]"><JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Insight B2B TemuClient", description: metadata.description, url: `${baseUrl}/insight`, mainEntity: { "@type": "ItemList", itemListElement: articles.map((article, index) => ({ "@type": "ListItem", position: index + 1, url: `${baseUrl}/insight/${article.slug}`, name: article.title })) } }} /><MarketingNav/><main>
    <header className="overflow-hidden border-b border-[#eadfe3] bg-[radial-gradient(circle_at_72%_20%,#fff1f5_0%,#ffffff_48%)]">
      <div className="mx-auto max-w-[1160px] px-5 py-16 sm:px-8 lg:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d83267]">TemuClient Insight</p>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end"><h1 className="max-w-4xl text-[clamp(3rem,6.5vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.055em]">Ide yang membantu bisnis <em className="font-normal text-[#d83267]">menemukan kecocokan.</em></h1><p className="max-w-md text-lg leading-8 text-[#5d686b]">Panduan praktis tentang sales B2B, menyusun requirement, memilih software house, membaca buyer intent, dan membawa percakapan menuju deal.</p></div>
        {categories.length > 0 && <div className="mt-10 flex flex-wrap gap-2">{categories.map((category) => <span className="rounded-full border border-[#ddd8da] bg-white px-4 py-2 text-xs font-semibold text-[#596568]" key={category}>{category}</span>)}</div>}
      </div>
    </header>

    <section className="mx-auto max-w-[1160px] px-5 py-16 sm:px-8 lg:py-20">
      {featured ? <>
        <article className="group grid overflow-hidden rounded-[24px] border border-[#e6dde0] bg-[#fff3f7] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex min-h-[340px] flex-col justify-between bg-[#071518] p-7 text-white sm:p-10">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#ff8bb2]">Pilihan editor</span><BookOpen className="size-5 text-white/40" /></div>
            <div><p className="max-w-sm text-3xl font-medium leading-tight tracking-[-0.035em]">Need → Qualification → Match → Introduction → Meeting → Deal</p><p className="mt-5 text-sm leading-6 text-white/55">Kerangka praktis untuk hubungan bisnis yang lebih relevan dan dapat dipercaya.</p></div>
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12"><div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#d83267]"><span>{featured.category}</span><span className="size-1 rounded-full bg-[#d5c8cc]" /><span className="flex items-center gap-1 text-[#778285]"><Clock3 className="size-3" />{featured.readingTimeMinutes} menit baca</span></div><h2 className="mt-5 text-3xl font-medium leading-tight tracking-[-0.035em] sm:text-4xl"><Link className="transition-colors group-hover:text-[#d83267]" href={`/insight/${featured.slug}`}>{featured.title}</Link></h2><p className="mt-5 max-w-2xl leading-7 text-[#657174]">{featured.description}</p><div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#dfd4d8] pt-5"><p className="text-xs text-[#7c8789]">{date(featured.publishedAt)} · {featured.authorName}</p><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#ad204f]" href={`/insight/${featured.slug}`}>Baca insight <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div></div>
        </article>

        <div className="mt-20 flex items-end justify-between gap-6 border-b border-[#dfe3e3] pb-6"><div><p className="text-sm font-semibold text-[#d83267]">Artikel terbaru</p><h2 className="mt-3 text-3xl font-medium tracking-[-0.035em] sm:text-4xl">Untuk keputusan B2B yang lebih jernih.</h2></div><p className="hidden text-sm text-[#7b8587] sm:block">{articles.length} artikel</p></div>
        {remaining.length > 0 ? <div className="grid gap-x-10 md:grid-cols-2">{remaining.map((article, index) => <article className="group border-b border-[#dfe3e3] py-8" key={article.id}><div className="flex items-center justify-between gap-4"><p className="text-xs font-semibold text-[#d83267]">{article.category}</p><p className="font-mono text-xs text-[#9aa2a4]">{String(index + 2).padStart(2, "0")}</p></div><h3 className="mt-5 text-2xl font-medium leading-8 tracking-[-0.025em]"><Link className="transition-colors group-hover:text-[#d83267]" href={`/insight/${article.slug}`}>{article.title}</Link></h3><p className="mt-4 line-clamp-3 leading-7 text-[#657174]">{article.description}</p><div className="mt-6 flex items-center justify-between text-xs text-[#7d888a]"><span>{article.readingTimeMinutes} menit baca</span><span>{date(article.publishedAt)}</span></div></article>)}</div> : <p className="py-10 text-sm text-[#657174]">Artikel berikutnya sedang melewati review editorial.</p>}
      </> : <EmptyState title="Insight segera hadir" description="Artikel yang telah melewati review editorial akan muncul di halaman ini." />}
    </section>

    <section className="bg-[#d83267] text-white"><div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8"><h2 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Ubah insight menjadi percakapan bisnis yang tepat.</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">Temukan kebutuhan atau keahlian yang relevan dalam jaringan TemuClient.</p><Link className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#071518] px-7 text-sm font-semibold" href="/register">Mulai gratis <ArrowRight className="size-4" /></Link></div></section>
  </main><MarketingFooter/></div>;
}
