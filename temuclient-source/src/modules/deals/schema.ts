import { z } from "zod";

const moneySchema = z
  .union([
    z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    z.string().regex(/^\d+$/, "Nilai harus berupa bilangan bulat."),
  ])
  .transform((value) => BigInt(value));

const currencySchema = z.string().trim().length(3).transform((value) => value.toUpperCase());

export const dealListQuerySchema = z.object({
  stage: z.enum(["INTRODUCTION", "DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).optional(),
  status: z.enum(["OPEN", "WON", "LOST"]).optional(),
  owner: z.string().trim().min(1).optional(),
  q: z.string().trim().max(120).optional(),
  expectedCloseFrom: z.iso.date().optional(),
  expectedCloseTo: z.iso.date().optional(),
  view: z.enum(["board", "list", "closed"]).default("board"),
});

export const createDealSchema = z.object({
  opportunityId: z.string().trim().min(1),
  ownerUserId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(3).max(160).optional(),
  estimatedValue: moneySchema.nullable().optional(),
  currency: currencySchema.default("IDR"),
  probability: z.coerce.number().int().min(0).max(100).default(10),
  expectedCloseDate: z.iso.datetime().nullable().optional(),
});

export const updateDealSchema = z
  .object({
    ownerUserId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(3).max(160).optional(),
    estimatedValue: moneySchema.nullable().optional(),
    currency: currencySchema.optional(),
    probability: z.coerce.number().int().min(0).max(100).optional(),
    expectedCloseDate: z.iso.datetime().nullable().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Setidaknya satu perubahan diperlukan.",
  });

export const changeDealStageSchema = z.object({
  stage: z.enum(["DISCOVERY", "PROPOSAL", "NEGOTIATION"]),
});

export const markDealWonSchema = z.object({
  finalValue: moneySchema.nullable().optional(),
});

export const markDealLostSchema = z.object({
  reason: z.string().trim().min(3, "Alasan Deal lost wajib diisi.").max(500),
});

export const activityListQuerySchema = z.object({
  type: z.enum(["NOTE", "CALL", "EMAIL", "MEETING", "STAGE_CHANGE", "PROPOSAL", "SYSTEM"]).optional(),
});

export const createDealActivitySchema = z.object({
  type: z.enum(["NOTE", "CALL", "EMAIL", "MEETING"]),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  occurredAt: z.iso.datetime().optional(),
});

export type DealListQuery = z.infer<typeof dealListQuerySchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type CreateDealActivityInput = z.infer<typeof createDealActivitySchema>;

export { moneySchema };
