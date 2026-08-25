import { z } from "zod";

const optionalMoney = z.preprocess((value) => value === "" || value === null ? undefined : value, z.union([
  z.string().regex(/^\d+$/, "Nilai proyek harus berupa angka.").transform((value) => BigInt(value)),
  z.number().int().nonnegative().transform((value) => BigInt(value)),
]).optional());
const optionalInteger = z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().int().min(1).max(120).optional());

const serviceFields = z.object({
  description: z.string().trim().max(1000).optional(),
  minProjectValue: optionalMoney,
  maxProjectValue: optionalMoney,
  currency: z.string().trim().length(3).toUpperCase().default("IDR"),
  typicalDurationMin: optionalInteger,
  typicalDurationMax: optionalInteger,
  isPrimary: z.boolean().default(false),
});

function validateRange(value: { minProjectValue?: bigint; maxProjectValue?: bigint; typicalDurationMin?: number; typicalDurationMax?: number }, context: z.RefinementCtx) {
  if (value.minProjectValue !== undefined && value.maxProjectValue !== undefined && value.minProjectValue > value.maxProjectValue) context.addIssue({ code: "custom", path: ["maxProjectValue"], message: "Nilai maksimum harus lebih besar dari minimum." });
  if (value.typicalDurationMin !== undefined && value.typicalDurationMax !== undefined && value.typicalDurationMin > value.typicalDurationMax) context.addIssue({ code: "custom", path: ["typicalDurationMax"], message: "Durasi maksimum harus lebih besar dari minimum." });
}

export const createOrganizationServiceSchema = serviceFields.extend({ serviceCategoryId: z.string().min(1) }).superRefine(validateRange);
export const updateOrganizationServiceSchema = serviceFields.partial().refine((value) => Object.keys(value).length > 0, "Tidak ada perubahan.").superRefine(validateRange);

export type CreateOrganizationServiceInput = z.infer<typeof createOrganizationServiceSchema>;
export type UpdateOrganizationServiceInput = z.infer<typeof updateOrganizationServiceSchema>;
