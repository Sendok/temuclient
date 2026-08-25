import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("article Markdown persistence and public projection", async () => {
  const { db } = await import("../../src/server/db/client");
  const { listPublishedArticles, uploadArticleMarkdown } = await import("../../src/modules/articles/service");
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const slug = `article-integration-${nonce}`;
  let admin: { id: string };
  const content = `Artikel pengujian ini menjelaskan kebutuhan buyer dan evidence provider dengan bahasa yang cukup lengkap untuk melewati validasi panjang konten. Setiap klaim perlu ditinjau manusia sebelum publikasi dan perubahan harus tersimpan dalam audit log.\n\n## Qualification\n\nQualification memisahkan kecocokan provider dari kesiapan buyer agar prioritas dapat dijelaskan secara transparan.`;

  beforeAll(async () => {
    admin = await db.user.create({ data: { name: "Article Admin", email: `article-admin-${nonce}@example.test`, platformRole: "ADMIN" } });
  });

  afterAll(async () => {
    const article = await db.article.findUnique({ where: { slug } });
    if (article) await db.auditLog.deleteMany({ where: { entityType: "Article", entityId: article.id } });
    await db.article.deleteMany({ where: { slug } });
    await db.user.delete({ where: { id: admin.id } });
    await db.$disconnect();
  });

  it("keeps drafts private, publishes through an audited upsert, and preserves one slug", async () => {
    const frontmatter = (status: "DRAFT" | "PUBLISHED") => `---\ntitle: Article Integration Test\nslug: ${slug}\ndescription: Artikel integrasi yang memastikan draft tetap privat dan publikasi Markdown memiliki audit serta proyeksi publik yang aman.\nstatus: ${status}\n---\n${content}`;
    const draft = await uploadArticleMarkdown(admin.id, frontmatter("DRAFT"), { ipAddress: "127.0.0.1", userAgent: "vitest" });
    expect(draft.status).toBe("DRAFT");
    expect((await listPublishedArticles()).some((article) => article.slug === slug)).toBe(false);

    const published = await uploadArticleMarkdown(admin.id, frontmatter("PUBLISHED"));
    expect(published.id).toBe(draft.id);
    expect(published.publishedAt).toBeInstanceOf(Date);
    expect((await listPublishedArticles()).some((article) => article.slug === slug)).toBe(true);
    expect(await db.article.count({ where: { slug } })).toBe(1);
    expect(await db.auditLog.count({ where: { entityId: draft.id, action: { in: ["ARTICLE_CREATED", "ARTICLE_UPDATED"] } } })).toBe(2);
  });
});
