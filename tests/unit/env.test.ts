import { describe, expect, it } from "vitest";

import { parseServerEnv } from "../../src/lib/env";

const validEnv = {
  NODE_ENV: "test",
  APP_URL: "http://localhost:3000",
  AUTH_SECRET: "test-auth-secret-with-at-least-32-characters",
  DATABASE_URL: "postgresql://temuclient:temuclient@localhost:5432/temuclient",
  REDIS_URL: "redis://localhost:6379",
} satisfies NodeJS.ProcessEnv;

describe("server environment", () => {
  it("accepts the required bootstrap configuration", () => {
    expect(parseServerEnv(validEnv)).toMatchObject(validEnv);
  });

  it("rejects missing required configuration without exposing values", () => {
    expect(() => parseServerEnv({ NODE_ENV: "test" })).toThrow(
      "Invalid server environment: APP_URL, AUTH_SECRET, DATABASE_URL, REDIS_URL",
    );
  });

  it("rejects an incompatible database protocol", () => {
    expect(() => parseServerEnv({ ...validEnv, DATABASE_URL: "mysql://localhost/app" })).toThrow(
      "Invalid server environment: DATABASE_URL",
    );
  });

  it("requires a Gemini key only when the Gemini provider is selected", () => {
    expect(() => parseServerEnv({ ...validEnv, AI_PROVIDER: "gemini" })).toThrow(/GEMINI_API_KEY/);
    expect(parseServerEnv({ ...validEnv, AI_PROVIDER: "gemini", GEMINI_API_KEY: "test-gemini-key" }))
      .toMatchObject({ AI_PROVIDER: "gemini", GEMINI_MODEL: "gemini-2.5-flash" });
  });
});
