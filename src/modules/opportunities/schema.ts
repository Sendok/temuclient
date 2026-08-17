import { z } from "zod";

const optionalMoney = z.preprocess((value) => value === "" || value === null ? undefined : value, z.union([z.string().regex(/^\d+$/).transform(BigInt), z.number().int().nonnegative().transform(BigInt)]).optional());
const optionalDate = z.preprocess((value) => value === "" || value === null ? undefined : value, z.iso.date().transform((value) => new Date(`${value}T00:00:00.000Z`)).optional());
const optionalText = (max: number) => z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().trim().max(max).optional());

export const requirementItemSchema = z.object({ category: z.string().trim().min(2).max(80).default("FUNCTIONAL"), label: z.string().trim().min(2).max(150), description: z.string().trim().min(5).max(1000), priority: z.enum(["MUST_HAVE", "SHOULD_HAVE", "NICE_TO_HAVE"]), sortOrder: z.number().int().min(0).default(0) });
const opportunityFields = z.object({
  title: z.string().trim().min(5).max(180).optional(), serviceCategoryId: z.string().min(1).optional(), industryId: z.string().min(1).optional(), problemStatement: z.string().trim().min(20).max(5000).optional(), businessObjective: optionalText(2000), description: optionalText(5000), projectType: z.enum(["NEW_DEVELOPMENT", "SYSTEM_REPLACEMENT", "SYSTEM_INTEGRATION", "CONSULTING", "MANAGED_SERVICE", "OUTSOURCING", "AUDIT", "IMPLEMENTATION", "MIGRATION"]).optional(), budgetMin: optionalMoney, budgetMax: optionalMoney, currency: z.string().trim().length(3).toUpperCase().default("IDR"), budgetStatus: z.enum(["ESTIMATED", "APPROVED", "FLEXIBLE", "UNDISCLOSED"]).optional(), timelineStart: optionalDate, timelineEnd: optionalDate, country: z.string().trim().min(2).max(100).default("Indonesia"), province: optionalText(100), city: optionalText(100), remoteAllowed: z.boolean().default(true), preferredProviderLocation: optionalText(150), decisionMakerInvolved: z.boolean().default(false), requirements: z.array(requirementItemSchema).max(50).optional(), markForReview: z.boolean().optional(),
});

function validateRanges(value: { budgetMin?: bigint; budgetMax?: bigint; timelineStart?: Date; timelineEnd?: Date }, context: z.RefinementCtx) { if (value.budgetMin !== undefined && value.budgetMax !== undefined && value.budgetMin > value.budgetMax) context.addIssue({ code: "custom", path: ["budgetMax"], message: "Budget maksimum harus lebih besar dari minimum." }); if (value.timelineStart && value.timelineEnd && value.timelineStart > value.timelineEnd) context.addIssue({ code: "custom", path: ["timelineEnd"], message: "Timeline selesai harus setelah tanggal mulai." }); }

export const createOpportunitySchema = opportunityFields.extend({ initialDescription: z.string().trim().min(20).max(5000).optional() }).superRefine((value, context) => { if (!value.initialDescription && !value.problemStatement) context.addIssue({ code: "custom", path: ["initialDescription"], message: "Ceritakan kebutuhan perusahaan Anda." }); validateRanges(value, context); });
export const updateOpportunitySchema = opportunityFields.partial().refine((value) => Object.keys(value).length > 0, "Tidak ada perubahan.").superRefine(validateRanges);
export const extendOpportunitySchema = z.object({ days: z.coerce.number().int().min(1).max(180).default(30) });
export const attachmentMetadataSchema = z.object({ name: z.string().trim().min(1).max(255), storageKey: z.string().trim().min(10).max(1000).optional(), mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]), size: z.number().int().positive().max(10 * 1024 * 1024), visibility: z.enum(["BUYER_ONLY", "INTRODUCED_PROVIDER", "PUBLIC_SUMMARY"]).default("BUYER_ONLY") });

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type AttachmentMetadataInput = z.infer<typeof attachmentMetadataSchema>;
