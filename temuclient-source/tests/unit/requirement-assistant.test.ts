import { describe, expect, it } from "vitest";

import { getRequirementAssistant } from "../../src/modules/ai/requirements";
import { attachmentMetadataSchema } from "../../src/modules/opportunities/schema";

describe("Requirement Builder fallback and attachment validation", () => {
  it("returns validated fallback output without publishing or requiring an API key", async () => {
    const assistant = getRequirementAssistant();
    const text = "Kami membutuhkan sistem inventory terintegrasi untuk lima warehouse di Indonesia.";
    await expect(assistant.questions(text)).resolves.toMatchObject({ mode: "fallback" });
    await expect(assistant.structure(text)).resolves.toMatchObject({ mode: "fallback", problemStatement: text });
  });

  it("accepts only approved attachment MIME types and sizes", () => {
    expect(attachmentMetadataSchema.parse({ name: "requirement.pdf", mimeType: "application/pdf", size: 1024, visibility: "BUYER_ONLY" })).toMatchObject({ mimeType: "application/pdf" });
    expect(() => attachmentMetadataSchema.parse({ name: "script.exe", mimeType: "application/octet-stream", size: 1024 })).toThrow();
    expect(() => attachmentMetadataSchema.parse({ name: "large.pdf", mimeType: "application/pdf", size: 11 * 1024 * 1024 })).toThrow();
  });
});
