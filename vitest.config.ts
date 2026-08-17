import "dotenv/config";

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    maxWorkers: process.env.RUN_DATABASE_TESTS === "true" ? 1 : undefined,
    passWithNoTests: false,
  },
});
