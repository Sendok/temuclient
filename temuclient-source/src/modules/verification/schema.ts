import { z } from "zod";

export const verificationRequestSchema = z
  .object({
    type: z.enum(["COMPANY", "DOMAIN", "CONTACT", "REQUIREMENT", "BUDGET", "DECISION_MAKER"]),
    entityType: z.enum(["ORGANIZATION", "OPPORTUNITY"]),
    entityId: z.string().cuid(),
    evidence: z.record(z.string(), z.union([z.string().trim().max(2000), z.number(), z.boolean()])).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .superRefine((input, ctx) => {
    const organizationTypes = ["COMPANY", "DOMAIN", "CONTACT"];
    if (input.entityType === "ORGANIZATION" && !organizationTypes.includes(input.type)) {
      ctx.addIssue({ code: "custom", path: ["type"], message: "Tipe ini hanya dapat diminta untuk Opportunity." });
    }
    if (input.entityType === "OPPORTUNITY" && organizationTypes.includes(input.type)) {
      ctx.addIssue({ code: "custom", path: ["type"], message: "Tipe ini hanya dapat diminta untuk organisasi." });
    }
  });

export type VerificationRequestInput = z.infer<typeof verificationRequestSchema>;
