import type { MetadataRoute } from "next";

import { getServerEnv } from "@/lib/env";
import { listPublishedArticles } from "@/modules/articles/service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getServerEnv().APP_URL;
  const articles = await listPublishedArticles();
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/for-providers`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/for-buyers`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/pricing`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/insight`, changeFrequency: "weekly", priority: 0.8 },
  ];
  return [...staticPages, ...articles.map((article) => ({ url: `${baseUrl}/insight/${article.slug}`, lastModified: article.updatedAt, changeFrequency: "monthly" as const, priority: 0.75 }))];
}
