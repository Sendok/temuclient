import { z } from "zod";

const meetingFields = {
  title: z.string().trim().min(3).max(160),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  timezone: z.string().trim().min(1).max(100).default("Asia/Jakarta"),
  meetingProvider: z.string().trim().max(60).nullable().optional(),
  meetingUrl: z.url().startsWith("https://", "Meeting URL harus menggunakan HTTPS.").nullable().optional(),
};

export const meetingListQuerySchema = z.object({
  view: z.enum(["upcoming", "past"]).default("upcoming"),
  opportunityId: z.string().trim().min(1).optional(),
});

export const createMeetingSchema = z.object({
  ...meetingFields,
  opportunityId: z.string().trim().min(1),
  introductionId: z.string().trim().min(1).optional(),
  dealId: z.string().trim().min(1).nullable().optional(),
});

export const updateMeetingSchema = z
  .object({
    title: meetingFields.title.optional(),
    startsAt: meetingFields.startsAt.optional(),
    endsAt: meetingFields.endsAt.optional(),
    timezone: meetingFields.timezone.optional(),
    meetingProvider: meetingFields.meetingProvider,
    meetingUrl: meetingFields.meetingUrl,
    status: z.enum(["COMPLETED", "NO_SHOW"]).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Setidaknya satu perubahan diperlukan.",
  });

export type MeetingListQuery = z.infer<typeof meetingListQuerySchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
