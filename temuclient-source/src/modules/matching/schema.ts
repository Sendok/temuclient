import { z } from "zod";

export const providerFeedQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  service: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  city: z.string().trim().max(80).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  sort: z.enum(["match", "intent", "recent"]).default("match"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ProviderFeedQuery = z.infer<typeof providerFeedQuerySchema>;

export const compareProviderIdsSchema = z.array(z.string().min(1)).min(1).max(3).transform((ids) => [...new Set(ids)]);
