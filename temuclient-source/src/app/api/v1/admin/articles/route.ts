import { revalidatePath } from "next/cache";

import { apiError, apiSuccess } from "@/lib/api-response";
import { DomainError } from "@/lib/errors/domain-error";
import { ARTICLE_MAX_BYTES } from "@/modules/articles/schema";
import { uploadArticleMarkdown } from "@/modules/articles/service";
import { requirePlatformRole } from "@/server/auth/authorization";
import { getAuditRequestContext } from "@/server/http/request-context";

export async function POST(request: Request) {
  try {
    const context = await requirePlatformRole(["SUPER_ADMIN", "ADMIN"]);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new DomainError("ARTICLE_FILE_REQUIRED", "Pilih file Markdown untuk diunggah.", 400);
    if (!/\.(md|markdown)$/i.test(file.name)) throw new DomainError("FILE_TYPE_NOT_ALLOWED", "Artikel harus berupa file .md atau .markdown.", 400);
    if (file.size > ARTICLE_MAX_BYTES) throw new DomainError("FILE_TOO_LARGE", "Ukuran artikel maksimal 500 KB.", 413);
    const article = await uploadArticleMarkdown(context.user.id, await file.text(), getAuditRequestContext(request));
    revalidatePath("/insight");
    revalidatePath(`/insight/${article.slug}`);
    revalidatePath("/sitemap.xml");
    return apiSuccess({ id: article.id, slug: article.slug, title: article.title, status: article.status }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
