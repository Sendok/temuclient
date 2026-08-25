import { describe, expect, it } from "vitest";
import { z } from "zod";

import { apiError } from "../../src/lib/api-response";

describe("API error responses", () => {
  it("returns field validation errors for a local ZodError", async () => {
    const schema = z.object({ email: z.email() });
    const response = apiError(schema.safeParse({ email: "invalid" }).error);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "VALIDATION_ERROR", fieldErrors: { email: expect.any(String) } },
    });
  });

  it.each(["ZodError", "$ZodError"])("recognizes a structurally valid %s from another bundle instance", async (name) => {
    const response = apiError({
      name,
      issues: [{ path: ["password"], message: "Password wajib diisi." }],
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: { password: "Password wajib diisi." },
      },
    });
  });
});
