import { z } from "zod";

const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.url().optional());
const optionalEmail = z.preprocess((value) => value === "" ? undefined : value, z.email().optional());

export const providerProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  website: optionalUrl,
  description: z.string().trim().min(20).max(2000).optional(),
  province: z.string().trim().min(2).max(100).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  businessEmail: optionalEmail,
  phone: z.string().trim().min(8).max(30).optional(),
  companySize: z.coerce.number().int().min(1).max(100000).optional(),
  teamCapacity: z.coerce.number().int().min(0).max(10000).optional(),
  availability: z.enum(["AVAILABLE", "LIMITED", "UNAVAILABLE"]).optional(),
  industrySelections: z.array(z.object({
    industryId: z.string().min(1),
    experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  })).max(20).optional(),
}).refine((value) => Object.keys(value).length > 0, "Tidak ada perubahan.");

export type ProviderProfileUpdate = z.infer<typeof providerProfileUpdateSchema>;
