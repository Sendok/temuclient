import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleMarkdown } from "@/components/articles/article-markdown";
import { JsonLd } from "@/components/articles/json-ld";
import { MarketingFooter, MarketingNav } from "@/components/marketing/site-shell";
import { Badge } from "@/components/ui/primitives";
import { getServerEnv } from "@/lib/env";
import { extractFaq } from "@/modules/articles/markdown";
import { getPublishedArticle } from "@/modules/articles/service";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getPublishedArticle((await params).slug);
  if (!article) return { title: "Artikel tidak ditemukan", robots: { index: false, follow: false } };
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/insight/${article.slug}` },
    authors: [{ name: article.authorName }],
    openGraph: { type: "article", locale: "id_ID", url: `/insight/${article.slug}`, title: article.title, description: article.description, publishedTime: article.publishedAt?.toISOString(), modifiedTime: article.updatedAt.toISOString(), authors: [article.authorName], tags: article.tags },
    twitter: { card: "summary_large_image", title: article.title, description: article.description },
  };
}

function iso(value: Date | null) { return value?.toISOString(); }
function displayDate(value: Date | null) { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(value) : ""; }

export default async function ArticlePage({ params }: Props) {
  const article = await getPublishedArticle((await params).slug);
  if (!article) notFound();
  const baseUrl = getServerEnv().APP_URL;
  const url = `${baseUrl}/insight/${article.slug}`;
  const faq = extractFaq(article.contentMarkdown);
  const structuredData: Record<string, unknown>[] = [
    { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.description, datePublished: iso(article.publishedAt), dateModified: article.updatedAt.toISOString(), inLanguage: "id-ID", mainEntityOfPage: url, url, author: { "@type": "Organization", name: article.authorName }, publisher: { "@type": "Organization", name: "TemuClient", url: baseUrl }, articleSection: article.category, keywords: article.keywords.join(", ") },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Beranda", item: baseUrl }, { "@type": "ListItem", position: 2, name: "Insight", item: `${baseUrl}/insight` }, { "@type": "ListItem", position: 3, name: article.title, item: url }] },
  ];
  if (faq.length) structuredData.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) });
  return <div><JsonLd data={structuredData}/><MarketingNav/><main><article><header className="border-b bg-surface"><div className="mx-auto max-w-3xl px-4 py-14 sm:px-6"><nav aria-label="Breadcrumb" className="text-sm text-text-muted"><Link href="/insight">Insight</Link><span aria-hidden className="px-2">/</span><span>{article.category}</span></nav><div className="mt-6 flex flex-wrap items-center gap-3"><Badge tone="brand">{article.category}</Badge><span className="text-sm text-text-muted">{article.readingTimeMinutes} menit baca</span></div><h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">{article.title}</h1><p className="mt-6 text-lg leading-8 text-text-secondary">{article.description}</p><div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted"><span>Oleh {article.authorName}</span><span aria-hidden>•</span><time dateTime={iso(article.publishedAt)}>{displayDate(article.publishedAt)}</time>{article.updatedAt.getTime() !== article.publishedAt?.getTime() && <><span aria-hidden>•</span><span>Diperbarui {displayDate(article.updatedAt)}</span></>}</div></div></header><div className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><aside className="mb-10 border-l-4 border-brand-500 bg-brand-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Ringkasan</p><p className="mt-2 leading-7">{article.description}</p></aside><ArticleMarkdown source={article.contentMarkdown}/><footer className="mt-14 border-t pt-6"><div className="flex flex-wrap gap-2">{article.tags.map((tag) => <span className="rounded-md bg-surface-muted px-2.5 py-1 text-xs text-text-secondary" key={tag}>{tag}</span>)}</div><Link className="mt-8 inline-flex font-semibold text-brand-700" href="/insight">← Kembali ke Insight</Link></footer></div></article></main><MarketingFooter/></div>;
}
