import { z } from "zod";

const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
};

export const adminListQuerySchema = z.object({
  ...pageFields,
  status: z.string().trim().max(40).optional(),
  type: z.string().trim().max(40).optional(),
});

export const auditLogQuerySchema = z.object({
  ...pageFields,
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(80).optional(),
  actor: z.string().trim().max(120).optional(),
});

export const moderationReasonSchema = z.object({
  reason: z.string().trim().min(10, "Alasan minimal 10 karakter.").max(1000),
});

export const flagOpportunitySchema = moderationReasonSchema.extend({
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  signal: z.enum([
    "MANUAL_REVIEW",
    "DUPLICATE_SUBMISSION",
    "DOMAIN_MISMATCH",
    "REPEATED_REJECTION",
    "ACCOUNT_STATUS",
  ]).default("MANUAL_REVIEW"),
});

export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
export type ModerationReason = z.infer<typeof moderationReasonSchema>;
export type FlagOpportunityInput = z.infer<typeof flagOpportunitySchema>;
