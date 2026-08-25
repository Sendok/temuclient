import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.url()]).transform((value) => value || undefined);
const optionalEmail = z.union([z.literal(""), z.email()]).transform((value) => value || undefined);

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  type: z.enum(["BUYER", "PROVIDER"]),
  website: optionalUrl.optional(),
  city: z.string().trim().min(2).max(100),
  description: z.string().trim().min(20).max(2000),
  businessEmail: optionalEmail.optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.omit({ type: true }).partial().refine(
  (value) => Object.keys(value).length > 0,
  "Tidak ada perubahan.",
);

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const inviteOrganizationMemberSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  role: z.enum(["ADMIN", "SALES", "MEMBER"]),
});

export type InviteOrganizationMemberInput = z.infer<typeof inviteOrganizationMemberSchema>;
