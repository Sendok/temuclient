import { DomainError } from "@/lib/errors/domain-error";
import type { Prisma } from "@/generated/prisma/client";
import { assertValidTimezone } from "@/lib/dates/timezone";
import { canManageMeeting, canTransitionMeeting } from "@/modules/meetings/permissions";
import type {
  CreateMeetingInput,
  MeetingListQuery,
  UpdateMeetingInput,
} from "@/modules/meetings/schema";
import { db } from "@/server/db/client";

const meetingInclude = {
  opportunity: { select: { id: true, title: true } },
  introduction: {
    select: {
      id: true,
      status: true,
      buyerOrganizationId: true,
      providerOrganizationId: true,
    },
  },
  createdBy: { select: { id: true, name: true } },
  participants: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      userId: true,
      email: true,
      name: true,
      role: true,
      attendanceStatus: true,
    },
  },
} as const;

type MeetingRecord = Prisma.MeetingGetPayload<{ include: typeof meetingInclude }>;

export async function listMeetings(
  userId: string,
  organizationId: string,
  query: MeetingListQuery,
) {
  const now = new Date();
  const rows = await db.meeting.findMany({
    where: {
      participants: { some: { userId } },
      introduction: {
        OR: [
          { buyerOrganizationId: organizationId },
          { providerOrganizationId: organizationId },
        ],
      },
      opportunityId: query.opportunityId,
      ...(query.view === "upcoming"
        ? { status: "SCHEDULED", endsAt: { gte: now } }
        : {
            OR: [
              { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
              { endsAt: { lt: now } },
            ],
          }),
    },
    include: meetingInclude,
    orderBy: { startsAt: query.view === "upcoming" ? "asc" : "desc" },
  });
  return rows.map(toMeetingDto);
}

export async function getMeeting(userId: string, organizationId: string, id: string) {
  const meeting = await db.meeting.findUnique({ where: { id }, include: meetingInclude });
  assertMeetingAccess(meeting, userId, organizationId);
  return toMeetingDto(meeting!);
}

export async function createMeeting(
  userId: string,
  organizationId: string,
  input: CreateMeetingInput,
) {
  validateSchedule(input.startsAt, input.endsAt, input.timezone);
  return db.$transaction(async (transaction) => {
    const participant = await transaction.conversationParticipant.findFirst({
      where: {
        userId,
        organizationId,
        conversation: {
          opportunityId: input.opportunityId,
          introduction: {
            id: input.introductionId,
            status: "ACCEPTED",
            OR: [
              { buyerOrganizationId: organizationId },
              { providerOrganizationId: organizationId },
            ],
          },
        },
      },
      include: {
        conversation: {
          include: {
            introduction: true,
            participants: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                organization: { select: { type: true } },
              },
            },
          },
        },
      },
    });
    if (!participant?.conversation.introduction)
      throw new DomainError(
        "MEETING_RELATIONSHIP_REQUIRED",
        "Meeting hanya dapat dibuat dari Introduction yang diterima.",
        403,
      );
    const intro = participant.conversation.introduction;
    if (
      input.dealId &&
      participant.conversation.dealId &&
      input.dealId !== participant.conversation.dealId
    )
      throw new DomainError(
        "VALIDATION_ERROR",
        "Deal tidak terkait dengan Conversation ini.",
        400,
        { dealId: "Gunakan Deal dari Introduction yang sama." },
      );
    const meeting = await transaction.meeting.create({
      data: {
        opportunityId: input.opportunityId,
        introductionId: intro.id,
        dealId: participant.conversation.dealId ?? null,
        title: input.title,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        timezone: input.timezone,
        meetingProvider: input.meetingProvider ?? null,
        meetingUrl: input.meetingUrl ?? null,
        createdById: userId,
        participants: {
          create: participant.conversation.participants.map((item) => ({
            userId: item.user.id,
            email: item.user.email,
            name: item.user.name,
            role: item.organization.type,
          })),
        },
      },
      include: meetingInclude,
    });
    const recipients = participant.conversation.participants.filter((item) => item.userId !== userId);
    if (recipients.length)
      await transaction.notification.createMany({
        data: recipients.map((item) => ({
          userId: item.userId,
          type: "MEETING" as const,
          title: "Meeting dijadwalkan",
          body: `${input.title} telah dijadwalkan.`,
          entityType: "Meeting",
          entityId: meeting.id,
        })),
      });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: "MEETING_SCHEDULED",
        entityType: "Meeting",
        entityId: meeting.id,
        afterJson: {
          status: meeting.status,
          startsAt: meeting.startsAt.toISOString(),
          endsAt: meeting.endsAt.toISOString(),
          timezone: meeting.timezone,
        },
      },
    });
    await transaction.analyticsEvent.create({ data: { name: "meeting_created", userId, organizationId, entityType: "Meeting", entityId: meeting.id } });
    return toMeetingDto(meeting);
  });
}

export async function updateMeeting(
  userId: string,
  organizationId: string,
  id: string,
  input: UpdateMeetingInput,
) {
  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM "Meeting" WHERE id = ${id} FOR UPDATE`;
    const meeting = await transaction.meeting.findUnique({ where: { id }, include: meetingInclude });
    assertMeetingAccess(meeting, userId, organizationId);
    if (!canManageMeeting(meeting!.createdById, userId))
      throw new DomainError("FORBIDDEN", "Hanya pembuat meeting yang dapat mengubah jadwal.", 403);
    if (meeting!.status !== "SCHEDULED")
      throw new DomainError("INVALID_MEETING_STATE", "Meeting ini tidak lagi dapat diubah.", 409);
    const startsAt = input.startsAt ?? meeting!.startsAt.toISOString();
    const endsAt = input.endsAt ?? meeting!.endsAt.toISOString();
    const timezone = input.timezone ?? meeting!.timezone;
    validateSchedule(startsAt, endsAt, timezone, Boolean(input.status));
    if (input.status && !canTransitionMeeting(meeting!.status, input.status))
      throw new DomainError("INVALID_MEETING_STATE", "Status meeting tidak dapat diubah.", 409);
    const rescheduled = Boolean(input.startsAt || input.endsAt || input.timezone);
    const updated = await transaction.meeting.update({
      where: { id },
      data: {
        title: input.title,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        timezone: input.timezone,
        meetingProvider: input.meetingProvider,
        meetingUrl: input.meetingUrl,
        status: input.status,
      },
      include: meetingInclude,
    });
    const recipients = updated.participants.filter((item) => item.userId && item.userId !== userId);
    if (recipients.length && (rescheduled || input.status))
      await transaction.notification.createMany({
        data: recipients.map((item) => ({
          userId: item.userId!,
          type: "MEETING" as const,
          title: input.status === "COMPLETED" ? "Meeting selesai" : input.status === "NO_SHOW" ? "Meeting ditandai no-show" : "Meeting dijadwalkan ulang",
          body: `${updated.title} telah diperbarui.`,
          entityType: "Meeting",
          entityId: updated.id,
        })),
      });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: input.status ? `MEETING_${input.status}` : "MEETING_UPDATED",
        entityType: "Meeting",
        entityId: id,
        beforeJson: {
          status: meeting!.status,
          startsAt: meeting!.startsAt.toISOString(),
          endsAt: meeting!.endsAt.toISOString(),
        },
        afterJson: {
          status: updated.status,
          startsAt: updated.startsAt.toISOString(),
          endsAt: updated.endsAt.toISOString(),
        },
      },
    });
    return toMeetingDto(updated);
  });
}

export async function cancelMeeting(userId: string, organizationId: string, id: string) {
  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM "Meeting" WHERE id = ${id} FOR UPDATE`;
    const meeting = await transaction.meeting.findUnique({ where: { id }, include: meetingInclude });
    assertMeetingAccess(meeting, userId, organizationId);
    if (!canManageMeeting(meeting!.createdById, userId))
      throw new DomainError("FORBIDDEN", "Hanya pembuat meeting yang dapat membatalkan meeting.", 403);
    if (meeting!.status === "CANCELLED") return toMeetingDto(meeting!);
    if (!canTransitionMeeting(meeting!.status, "CANCELLED"))
      throw new DomainError("INVALID_MEETING_STATE", "Meeting ini tidak dapat dibatalkan.", 409);
    const updated = await transaction.meeting.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: meetingInclude,
    });
    const recipients = updated.participants.filter((item) => item.userId && item.userId !== userId);
    if (recipients.length)
      await transaction.notification.createMany({
        data: recipients.map((item) => ({
          userId: item.userId!,
          type: "MEETING" as const,
          title: "Meeting dibatalkan",
          body: `${updated.title} telah dibatalkan.`,
          entityType: "Meeting",
          entityId: updated.id,
        })),
      });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: "MEETING_CANCELLED",
        entityType: "Meeting",
        entityId: id,
        beforeJson: { status: meeting!.status },
        afterJson: { status: "CANCELLED" },
      },
    });
    return toMeetingDto(updated);
  });
}

function assertMeetingAccess(
  meeting: MeetingRecord | null,
  userId: string,
  organizationId: string,
): asserts meeting {
  if (
    !meeting ||
    !meeting.participants.some((item) => item.userId === userId) ||
    !meeting.introduction ||
    ![meeting.introduction.buyerOrganizationId, meeting.introduction.providerOrganizationId].includes(organizationId)
  )
    throw new DomainError("NOT_FOUND", "Meeting tidak ditemukan.", 404);
}

function validateSchedule(startsAt: string, endsAt: string, timezone: string, allowPast = false) {
  assertValidTimezone(timezone);
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (end <= start)
    throw new DomainError("VALIDATION_ERROR", "Waktu selesai harus setelah waktu mulai.", 400, {
      endsAt: "Pilih waktu selesai setelah waktu mulai.",
    });
  if (!allowPast && start <= new Date())
    throw new DomainError("VALIDATION_ERROR", "Meeting harus dijadwalkan di masa depan.", 400, {
      startsAt: "Pilih waktu mulai di masa depan.",
    });
  if (end.getTime() - start.getTime() > 8 * 60 * 60 * 1000)
    throw new DomainError("VALIDATION_ERROR", "Durasi meeting maksimal delapan jam.", 400);
}

function toMeetingDto(meeting: MeetingRecord) {
  return {
    id: meeting.id,
    opportunity: meeting.opportunity,
    introductionId: meeting.introductionId,
    dealId: meeting.dealId,
    title: meeting.title,
    startsAt: meeting.startsAt.toISOString(),
    endsAt: meeting.endsAt.toISOString(),
    timezone: meeting.timezone,
    meetingProvider: meeting.meetingProvider,
    meetingUrl: meeting.meetingUrl,
    status: meeting.status,
    createdBy: meeting.createdBy,
    participants: meeting.participants,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  };
}

export type MeetingData = Awaited<ReturnType<typeof getMeeting>>;
export type MeetingListData = Awaited<ReturnType<typeof listMeetings>>;
