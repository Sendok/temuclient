import { z } from "zod";

const optionalMoney = z.preprocess((value) => value === "" || value === null ? undefined : value, z.union([z.string().regex(/^\d+$/).transform(BigInt), z.number().int().nonnegative().transform(BigInt)]).optional());
const optionalDate = z.preprocess((value) => value === "" || value === null ? undefined : value, z.iso.date().transform((value) => new Date(`${value}T00:00:00.000Z`)).optional());

const portfolioFields = z.object({
  title: z.string().trim().min(3).max(150),
  clientName: z.string().trim().max(150).optional(),
  isClientConfidential: z.boolean().default(false),
  industryId: z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().min(1).optional()),
  problem: z.string().trim().min(20).max(3000),
  solution: z.string().trim().min(20).max(3000),
  outcome: z.string().trim().max(2000).optional(),
  projectValueMin: optionalMoney,
  projectValueMax: optionalMoney,
  currency: z.string().trim().length(3).toUpperCase().default("IDR"),
  durationMonths: z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().int().min(1).max(120).optional()),
  startedAt: optionalDate,
  completedAt: optionalDate,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  technologyIds: z.array(z.string().min(1)).max(30).default([]),
}).superRefine((value, context) => {
  if (!value.isClientConfidential && !value.clientName) context.addIssue({ code: "custom", path: ["clientName"], message: "Nama tampilan client diperlukan bila tidak confidential." });
  if (value.projectValueMin !== undefined && value.projectValueMax !== undefined && value.projectValueMin > value.projectValueMax) context.addIssue({ code: "custom", path: ["projectValueMax"], message: "Nilai maksimum harus lebih besar dari minimum." });
  if (value.startedAt && value.completedAt && value.startedAt > value.completedAt) context.addIssue({ code: "custom", path: ["completedAt"], message: "Tanggal selesai harus setelah tanggal mulai." });
});

export const createPortfolioSchema = portfolioFields;
export const updatePortfolioSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(), clientName: z.string().trim().max(150).optional(), isClientConfidential: z.boolean().optional(), industryId: z.string().min(1).nullable().optional(), problem: z.string().trim().min(20).max(3000).optional(), solution: z.string().trim().min(20).max(3000).optional(), outcome: z.string().trim().max(2000).nullable().optional(), projectValueMin: optionalMoney, projectValueMax: optionalMoney, currency: z.string().trim().length(3).toUpperCase().optional(), durationMonths: z.coerce.number().int().min(1).max(120).nullable().optional(), startedAt: optionalDate, completedAt: optionalDate, status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(), technologyIds: z.array(z.string().min(1)).max(30).optional(),
}).refine((value) => Object.keys(value).length > 0, "Tidak ada perubahan.");

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
