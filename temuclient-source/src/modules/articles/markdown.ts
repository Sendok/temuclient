import { DomainError } from "@/lib/errors/domain-error";
import { articleFrontmatterSchema, type ArticleFrontmatter } from "@/modules/articles/schema";

const FRONTMATTER_BOUNDARY = "---";

function parseList(value: string): string[] {
  const normalized = value.startsWith("[") && value.endsWith("]") ? value.slice(1, -1) : value;
  return normalized.split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
}

function parseScalar(value: string): string {
  return value.trim().replace(/^(['"])(.*)\1$/, "$2");
}

export function slugifyArticle(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

export function parseArticleMarkdown(source: string): { frontmatter: ArticleFrontmatter & { slug: string }; content: string; readingTimeMinutes: number } {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith(`${FRONTMATTER_BOUNDARY}\n`)) {
    throw new DomainError("ARTICLE_FRONTMATTER_REQUIRED", "Artikel harus diawali frontmatter Markdown.", 400);
  }
  const closingIndex = normalized.indexOf(`\n${FRONTMATTER_BOUNDARY}\n`, FRONTMATTER_BOUNDARY.length + 1);
  if (closingIndex < 0) throw new DomainError("ARTICLE_FRONTMATTER_INVALID", "Batas akhir frontmatter tidak ditemukan.", 400);

  const raw: Record<string, string | string[]> = {};
  const frontmatterBlock = normalized.slice(FRONTMATTER_BOUNDARY.length + 1, closingIndex);
  for (const line of frontmatterBlock.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new DomainError("ARTICLE_FRONTMATTER_INVALID", `Frontmatter tidak valid: ${line}`, 400);
    const key = line.slice(0, separator).trim();
    if (key in raw) throw new DomainError("ARTICLE_FRONTMATTER_INVALID", `Field ${key} ditulis lebih dari sekali.`, 400);
    const value = line.slice(separator + 1).trim();
    raw[key] = key === "tags" || key === "keywords" ? parseList(value) : parseScalar(value);
  }

  const parsed = articleFrontmatterSchema.parse(raw);
  const slug = parsed.slug ?? slugifyArticle(parsed.title);
  if (!slug) throw new DomainError("ARTICLE_SLUG_INVALID", "Judul tidak dapat menghasilkan slug artikel.", 400);
  const content = normalized.slice(closingIndex + `\n${FRONTMATTER_BOUNDARY}\n`.length).trim();
  if (content.length < 200) throw new DomainError("ARTICLE_CONTENT_TOO_SHORT", "Isi artikel minimal 200 karakter.", 400);
  if (/^#\s+/m.test(content)) throw new DomainError("ARTICLE_HEADING_INVALID", "Gunakan title frontmatter sebagai H1; isi artikel dimulai dari heading H2.", 400);
  const words = content.replace(/[`*_>#\[\]()!-]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return { frontmatter: { ...parsed, slug }, content, readingTimeMinutes: Math.max(1, Math.ceil(words / 200)) };
}

export function extractFaq(content: string): { question: string; answer: string }[] {
  const faqStart = content.search(/^##\s+(Pertanyaan Umum|FAQ)\s*$/im);
  if (faqStart < 0) return [];
  const faqRemainder = content.slice(faqStart).replace(/^##\s+(Pertanyaan Umum|FAQ)\s*$/im, "");
  const section = faqRemainder.split(/^##\s+/m)[0];
  return section.split(/^###\s+/m).slice(1, 11).map((block) => {
    const [question = "", ...answerLines] = block.split("\n");
    return {
      question: question.trim(),
      answer: answerLines.join("\n").replace(/\n+/g, " ").replace(/[*_`#[\]]/g, "").trim().slice(0, 500),
    };
  }).filter((item) => item.question.length > 0 && item.answer.length > 0);
}
