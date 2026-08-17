import { cache } from "react";

import type { AuditRequestContext } from "@/server/http/request-context";
import { db } from "@/server/db/client";
import { parseArticleMarkdown } from "@/modules/articles/markdown";

export async function uploadArticleMarkdown(actorUserId: string, source: string, context: AuditRequestContext = {}) {
  const parsed = parseArticleMarkdown(source);
  const existing = await db.article.findUnique({ where: { slug: parsed.frontmatter.slug } });
  const publishedAt = parsed.frontmatter.status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null;
  return db.$transaction(async (transaction) => {
    const article = await transaction.article.upsert({
      where: { slug: parsed.frontmatter.slug },
      create: {
        slug: parsed.frontmatter.slug,
        title: parsed.frontmatter.title,
        description: parsed.frontmatter.description,
        contentMarkdown: parsed.content,
        authorName: parsed.frontmatter.author ?? "Tim TemuClient",
        authorUserId: actorUserId,
        category: parsed.frontmatter.category,
        tags: parsed.frontmatter.tags,
        keywords: parsed.frontmatter.keywords,
        readingTimeMinutes: parsed.readingTimeMinutes,
        status: parsed.frontmatter.status,
        publishedAt,
      },
      update: {
        title: parsed.frontmatter.title,
        description: parsed.frontmatter.description,
        contentMarkdown: parsed.content,
        authorName: parsed.frontmatter.author ?? "Tim TemuClient",
        authorUserId: actorUserId,
        category: parsed.frontmatter.category,
        tags: parsed.frontmatter.tags,
        keywords: parsed.frontmatter.keywords,
        readingTimeMinutes: parsed.readingTimeMinutes,
        status: parsed.frontmatter.status,
        publishedAt,
      },
    });
    await transaction.auditLog.create({ data: {
      actorUserId,
      action: existing ? "ARTICLE_UPDATED" : "ARTICLE_CREATED",
      entityType: "Article",
      entityId: article.id,
      beforeJson: existing ? { slug: existing.slug, status: existing.status, title: existing.title } : undefined,
      afterJson: { slug: article.slug, status: article.status, title: article.title },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    } });
    return article;
  });
}

export async function listAdminArticles() {
  return db.article.findMany({ orderBy: [{ updatedAt: "desc" }, { id: "desc" }], select: { id: true, slug: true, title: true, category: true, status: true, publishedAt: true, updatedAt: true, authorName: true } });
}

export async function listPublishedArticles() {
  return db.article.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, orderBy: [{ publishedAt: "desc" }, { id: "desc" }], select: { id: true, slug: true, title: true, description: true, category: true, tags: true, authorName: true, readingTimeMinutes: true, publishedAt: true, updatedAt: true } });
}

export const getPublishedArticle = cache(async (slug: string) => db.article.findFirst({ where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } } }));
