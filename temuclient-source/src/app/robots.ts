import type { MetadataRoute } from "next";

import { getServerEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerEnv().APP_URL;
  return {
    rules: { userAgent: "*", allow: ["/", "/for-providers", "/for-buyers", "/pricing", "/insight", "/feed.xml", "/llms.txt"], disallow: ["/admin", "/app", "/api", "/login", "/register", "/forgot-password", "/reset-password", "/onboarding", "/prototype", "/design-system"] },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
