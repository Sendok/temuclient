import { getServerEnv } from "@/lib/env";
import { listPublishedArticles } from "@/modules/articles/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getServerEnv().APP_URL;
  const articles = await listPublishedArticles();
  const articleLinks = articles.map((article) => `- [${article.title}](${baseUrl}/insight/${article.slug}): ${article.description}`).join("\n");
  const body = `# TemuClient\n\n> Verified B2B Opportunity Network untuk buyer dan provider Indonesia.\n\nTemuClient menghubungkan business need dengan provider yang relevan melalui qualification, deterministic matching, buyer-controlled introduction, meeting, dan deal. TemuClient bukan freelance marketplace, contact database, atau alat outreach massal.\n\n## Halaman utama\n\n- [Untuk Provider](${baseUrl}/for-providers)\n- [Untuk Buyer](${baseUrl}/for-buyers)\n- [Pricing](${baseUrl}/pricing)\n- [Insight](${baseUrl}/insight)\n\n## Artikel\n\n${articleLinks || "Belum ada artikel yang dipublikasikan."}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
