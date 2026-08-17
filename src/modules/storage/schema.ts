import { z } from "zod";

export const uploadSignSchema = z.object({
  category: z.enum(["OPPORTUNITY_ATTACHMENT", "PORTFOLIO_IMAGE", "COMPANY_DOCUMENT"]),
  entityId: z.string().cuid().optional(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  size: z.number().int().positive().max(10 * 1024 * 1024),
}).superRefine((input, ctx) => { if (input.category === "OPPORTUNITY_ATTACHMENT" && !input.entityId) ctx.addIssue({ code: "custom", path: ["entityId"], message: "Opportunity wajib dipilih." }); });

export type UploadSignInput = z.infer<typeof uploadSignSchema>;
