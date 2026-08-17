import { getServerEnv } from "@/lib/env";
import { listPublishedArticles } from "@/modules/articles/service";

export const dynamic = "force-dynamic";

function xml(value: string): string { return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character] ?? character); }

export async function GET() {
  const baseUrl = getServerEnv().APP_URL;
  const articles = await listPublishedArticles();
  const items = articles.map((article) => `<item><title>${xml(article.title)}</title><link>${baseUrl}/insight/${article.slug}</link><guid isPermaLink="true">${baseUrl}/insight/${article.slug}</guid><description>${xml(article.description)}</description><author>${xml(article.authorName)}</author>${article.publishedAt ? `<pubDate>${article.publishedAt.toUTCString()}</pubDate>` : ""}</item>`).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>TemuClient Insight</title><link>${baseUrl}/insight</link><description>Insight untuk buyer dan provider B2B Indonesia.</description><language>id-ID</language>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
