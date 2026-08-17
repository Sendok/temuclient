import type { MeetingStatus } from "@/generated/prisma/enums";

export function canAccessMeeting(
  participantUserIds: readonly (string | null)[],
  userId: string,
) {
  return participantUserIds.includes(userId);
}

export function canManageMeeting(createdById: string, userId: string) {
  return createdById === userId;
}

export function canTransitionMeeting(
  from: MeetingStatus,
  to: MeetingStatus,
) {
  return from === "SCHEDULED" && ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(to);
}
