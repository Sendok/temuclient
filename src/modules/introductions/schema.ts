import { z } from "zod";

export const requestIntroductionSchema = z.object({
  portfolioIds: z
    .array(z.string().min(1))
    .min(1, "Pilih minimal satu portfolio relevan.")
    .max(3)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Portfolio tidak boleh duplikat.",
    ),
  fitSummary: z.string().trim().min(30).max(1_000),
  proposedApproach: z.string().trim().min(30).max(1_500),
  estimatedTimeline: z.string().trim().min(2).max(120),
  message: z.string().trim().min(5).max(500).optional(),
});

export const declineIntroductionSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
});

export const introductionListQuerySchema = z.object({
  status: z
    .enum(["REQUESTED", "ACCEPTED", "DECLINED", "CANCELLED", "EXPIRED"])
    .optional(),
  direction: z.enum(["incoming", "outgoing"]).optional(),
  opportunity: z.string().optional(),
});

export type RequestIntroductionInput = z.infer<
  typeof requestIntroductionSchema
>;
export type IntroductionListQuery = z.infer<typeof introductionListQuerySchema>;
