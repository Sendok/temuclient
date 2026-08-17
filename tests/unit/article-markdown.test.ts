import { describe, expect, it } from "vitest";

import { extractFaq, parseArticleMarkdown, slugifyArticle } from "../../src/modules/articles/markdown";

const body = `Paragraf pembuka yang menjelaskan konteks kebutuhan bisnis secara langsung dan cukup panjang agar pembaca memahami tujuan artikel ini. Informasi disusun dengan bahasa yang jelas, faktual, dan dapat ditinjau sebelum artikel dipublikasikan.\n\n## Pembahasan\n\nIsi pembahasan yang relevan.\n\n## Pertanyaan Umum\n\n### Apa manfaat utamanya?\n\nManfaat utamanya adalah keputusan yang lebih terstruktur dan dapat dijelaskan.`;

describe("article Markdown", () => {
  it("parses validated frontmatter and calculates reading time", () => {
    const result = parseArticleMarkdown(`---\ntitle: Panduan Memilih Vendor B2B\ndescription: Panduan lengkap untuk menilai vendor berdasarkan kebutuhan, evidence, risiko, dan kemampuan delivery yang dapat diverifikasi.\ntags: Vendor, Procurement\nkeywords: vendor B2B, memilih vendor\nstatus: PUBLISHED\n---\n${body}`);
    expect(result.frontmatter.slug).toBe("panduan-memilih-vendor-b2b");
    expect(result.frontmatter.tags).toEqual(["Vendor", "Procurement"]);
    expect(result.frontmatter.status).toBe("PUBLISHED");
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });

  it("rejects an H1 inside article content", () => {
    expect(() => parseArticleMarkdown(`---\ntitle: Panduan Memilih Vendor B2B\ndescription: Panduan lengkap untuk menilai vendor berdasarkan kebutuhan, evidence, risiko, dan kemampuan delivery yang dapat diverifikasi.\n---\n# Judul kedua\n${body}`)).toThrowError(expect.objectContaining({ code: "ARTICLE_HEADING_INVALID" }));
  });

  it("extracts FAQ answers for structured data", () => {
    expect(extractFaq(body)).toEqual([{ question: "Apa manfaat utamanya?", answer: "Manfaat utamanya adalah keputusan yang lebih terstruktur dan dapat dijelaskan." }]);
  });

  it("creates stable ASCII slugs", () => {
    expect(slugifyArticle("Strategi & Kualifikasi Opportunity B2B")).toBe("strategi-kualifikasi-opportunity-b2b");
  });
});
