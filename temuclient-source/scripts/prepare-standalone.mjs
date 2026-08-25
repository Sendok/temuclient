import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const buildRoot = resolve(".next");
const standaloneRoot = resolve(".next/standalone");

await mkdir(resolve(standaloneRoot, ".next"), { recursive: true });
await cp(resolve(buildRoot, "static"), resolve(standaloneRoot, ".next/static"), {
  recursive: true,
  force: true,
});

try {
  await cp(resolve("public"), resolve(standaloneRoot, "public"), {
    recursive: true,
    force: true,
  });
} catch (error) {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
}
