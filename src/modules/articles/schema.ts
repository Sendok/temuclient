import { z } from "zod";

export const ARTICLE_MAX_BYTES = 512_000;

export const articleFrontmatterSchema = z.object({
  title: z.string().trim().min(5).max(120),
  slug: z.string().trim().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().trim().min(50).max(320),
  author: z.string().trim().min(2).max(100).optional(),
  category: z.string().trim().min(2).max(80).default("Insight B2B"),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  keywords: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;
