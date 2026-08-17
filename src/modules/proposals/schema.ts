import { z } from "zod";

import { moneySchema } from "@/modules/deals/schema";

const fields = {
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(8000).nullable().optional(),
  amount: moneySchema.nullable().optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("IDR"),
  documentUrl: z.url().startsWith("https://", "Document URL harus menggunakan HTTPS.").nullable().optional(),
};

export const createProposalSchema = z.object(fields);

export const updateProposalSchema = z
  .object({
    title: fields.title.optional(),
    summary: fields.summary,
    amount: fields.amount,
    currency: fields.currency.optional(),
    documentUrl: fields.documentUrl,
    status: z.enum(["ACCEPTED", "REJECTED", "WITHDRAWN"]).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Setidaknya satu perubahan diperlukan.",
  });

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
