import "dotenv/config";

import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

import { uploadArticleMarkdown } from "../src/modules/articles/service";
import { db } from "../src/server/db/client";

const input = z.object({
  ARTICLE_IMPORT_ACTOR_EMAIL: z.email().transform((value) => value.trim().toLowerCase()),
}).parse(process.env);

async function main() {
  const actor = await db.user.findUnique({
    where: { email: input.ARTICLE_IMPORT_ACTOR_EMAIL },
    select: { id: true, platformRole: true },
  });
  if (!actor || (actor.platformRole !== "SUPER_ADMIN" && actor.platformRole !== "ADMIN")) {
    throw new Error("ARTICLE_IMPORT_ACTOR_EMAIL must identify an active platform administrator.");
  }

  const articleDirectory = resolve("content/articles");
  const fileNames = (await readdir(articleDirectory))
    .filter((fileName) => fileName.endsWith(".md") && fileName !== "README.md")
    .sort();
  if (fileNames.length === 0) throw new Error("No article Markdown files were found.");

  let imported = 0;
  for (const fileName of fileNames) {
    const source = await readFile(resolve(articleDirectory, fileName), "utf8");
    await uploadArticleMarkdown(actor.id, source, { userAgent: "temuclient-article-import-job" });
    imported += 1;
  }

  console.info(JSON.stringify({ status: "imported", articleCount: imported }));
}

await main().finally(() => db.$disconnect());

