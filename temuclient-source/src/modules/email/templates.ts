export type EmailTemplateInput =
  | { type: "verification"; verificationUrl: string }
  | { type: "password_reset"; resetUrl: string }
  | { type: "introduction_accepted"; opportunityTitle: string; appUrl: string }
  | { type: "meeting_scheduled"; meetingTitle: string; startsAt: string; appUrl: string }
  | { type: "security_notification"; message: string; appUrl: string };

export function renderEmailTemplate(input: EmailTemplateInput) {
  if (input.type === "verification") return { subject: "Verifikasi email TemuClient", text: `Verifikasi email kerja Anda: ${input.verificationUrl}` };
  if (input.type === "password_reset") return { subject: "Reset password TemuClient", text: `Gunakan tautan ini untuk reset password. Tautan berlaku 30 menit: ${input.resetUrl}` };
  if (input.type === "introduction_accepted") return { subject: "Introduction diterima", text: `Introduction untuk ${input.opportunityTitle} telah diterima. Buka workspace: ${input.appUrl}` };
  if (input.type === "meeting_scheduled") return { subject: "Meeting dijadwalkan", text: `${input.meetingTitle} dijadwalkan pada ${input.startsAt}. Buka workspace: ${input.appUrl}` };
  return { subject: "Notifikasi keamanan TemuClient", text: `${input.message} Buka pengaturan keamanan: ${input.appUrl}` };
}
