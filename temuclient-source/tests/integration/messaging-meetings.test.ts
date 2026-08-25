import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("Phase 6 messaging, meetings, and notifications", async () => {
  const { db } = await import("../../src/server/db/client");
  const { listMessages, sendMessage } = await import("../../src/modules/conversations/service");
  const { cancelMeeting, createMeeting, getMeeting, updateMeeting } = await import("../../src/modules/meetings/service");
  const { listNotifications, readAllNotifications, readNotification } = await import("../../src/modules/notifications/service");

  let providerId = "";
  let providerUserId = "";
  let buyerId = "";
  let buyerUserId = "";
  let unrelatedOrganizationId = "";
  let unrelatedUserId = "";
  let opportunityId = "";
  let introductionId = "";
  let conversationId = "";
  const meetingIds: string[] = [];

  beforeAll(async () => {
    const [provider, buyer, opportunity, unrelated, unrelatedUser] = await Promise.all([
      db.organization.findUniqueOrThrow({ where: { slug: "sagara-software" }, include: { members: { where: { status: "ACTIVE" }, take: 1 } } }),
      db.organization.findUniqueOrThrow({ where: { slug: "pt-nusantara-logistik" }, include: { members: { where: { status: "ACTIVE" }, take: 1 } } }),
      db.opportunity.findFirstOrThrow({ where: { slug: "warehouse-management-system" } }),
      db.organization.findUniqueOrThrow({ where: { slug: "nusa-systems" } }),
      db.user.findUniqueOrThrow({ where: { email: "admin@temuclient.local" } }),
    ]);
    providerId = provider.id;
    providerUserId = provider.members[0].userId;
    buyerId = buyer.id;
    buyerUserId = buyer.members[0].userId;
    const testOpportunity = await db.opportunity.create({
      data: {
        buyerOrganizationId: buyer.id,
        title: "Phase 6 Messaging Test",
        slug: `phase-6-messaging-${Date.now()}`,
        problemStatement: opportunity.problemStatement,
        status: "ACTIVE",
        createdById: buyer.members[0].userId,
      },
    });
    opportunityId = testOpportunity.id;
    unrelatedOrganizationId = unrelated.id;
    unrelatedUserId = unrelatedUser.id;
    const introduction = await db.introduction.create({
      data: {
        opportunityId,
        buyerOrganizationId: buyerId,
        providerOrganizationId: providerId,
        requestedById: providerUserId,
        acceptedById: buyerUserId,
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });
    introductionId = introduction.id;
    const conversation = await db.conversation.create({
      data: {
        opportunityId,
        introductionId,
        participants: {
          create: [
            { userId: providerUserId, organizationId: providerId },
            { userId: buyerUserId, organizationId: buyerId },
          ],
        },
      },
    });
    conversationId = conversation.id;
  });

  afterAll(async () => {
    if (meetingIds.length) {
      await db.auditLog.deleteMany({ where: { entityType: "Meeting", entityId: { in: meetingIds } } });
      await db.notification.deleteMany({ where: { entityType: "Meeting", entityId: { in: meetingIds } } });
      await db.meeting.deleteMany({ where: { id: { in: meetingIds } } });
    }
    const messages = await db.message.findMany({ where: { conversationId }, select: { id: true } });
    const messageIds = messages.map((item) => item.id);
    if (messageIds.length) await db.auditLog.deleteMany({ where: { entityType: "Message", entityId: { in: messageIds } } });
    await db.notification.deleteMany({ where: { entityType: "Conversation", entityId: conversationId } });
    await db.conversation.deleteMany({ where: { id: conversationId } });
    await db.introduction.deleteMany({ where: { id: introductionId } });
    await db.opportunity.deleteMany({ where: { id: opportunityId } });
    await db.$disconnect();
  });

  it("persists messages, reply-to, unread state, and recipient notifications", async () => {
    const first = await sendMessage(providerUserId, providerId, conversationId, { body: "Kami sudah meninjau kebutuhan warehouse." });
    const providerState = await db.conversationParticipant.findUniqueOrThrow({ where: { conversationId_userId: { conversationId, userId: providerUserId } } });
    const buyerBeforeRead = await db.conversationParticipant.findUniqueOrThrow({ where: { conversationId_userId: { conversationId, userId: buyerUserId } } });
    expect(providerState.lastReadAt).not.toBeNull();
    expect(buyerBeforeRead.lastReadAt).toBeNull();
    const buyerMessages = await listMessages(buyerUserId, buyerId, conversationId, { limit: 50 });
    expect(buyerMessages.items[0].body).toContain("warehouse");
    expect((await db.conversationParticipant.findUniqueOrThrow({ where: { conversationId_userId: { conversationId, userId: buyerUserId } } })).lastReadAt).not.toBeNull();
    const reply = await sendMessage(buyerUserId, buyerId, conversationId, { body: "Mari lanjutkan ke discovery.", replyToId: first.id });
    expect(reply.replyTo?.id).toBe(first.id);
    expect(await db.notification.count({ where: { entityType: "Conversation", entityId: conversationId, type: "MESSAGE" } })).toBe(2);
  });

  it("denies users and organizations outside the exact participant pair", async () => {
    await expect(sendMessage(unrelatedUserId, unrelatedOrganizationId, conversationId, { body: "Unauthorized" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(listMessages(providerUserId, buyerId, conversationId, { limit: 50 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("schedules, protects, reschedules, completes, and cancels meetings transactionally", async () => {
    const scheduled = await createMeeting(providerUserId, providerId, {
      title: "Discovery Meeting",
      opportunityId,
      introductionId,
      startsAt: "2030-08-15T03:00:00.000Z",
      endsAt: "2030-08-15T04:00:00.000Z",
      timezone: "Asia/Jakarta",
      meetingProvider: "GOOGLE_MEET",
      meetingUrl: "https://meet.google.com/test-room",
    });
    meetingIds.push(scheduled.id);
    expect(scheduled.participants).toHaveLength(2);
    expect((await getMeeting(buyerUserId, buyerId, scheduled.id)).meetingUrl).toContain("https://");
    await expect(getMeeting(unrelatedUserId, unrelatedOrganizationId, scheduled.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const rescheduled = await updateMeeting(providerUserId, providerId, scheduled.id, {
      startsAt: "2030-08-16T03:00:00.000Z",
      endsAt: "2030-08-16T04:00:00.000Z",
      timezone: "Asia/Jakarta",
    });
    expect(rescheduled.startsAt).toBe("2030-08-16T03:00:00.000Z");
    await expect(updateMeeting(buyerUserId, buyerId, scheduled.id, { title: "Buyer edit" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await updateMeeting(providerUserId, providerId, scheduled.id, { status: "COMPLETED" })).status).toBe("COMPLETED");

    const cancellable = await createMeeting(buyerUserId, buyerId, {
      title: "Follow-up Meeting",
      opportunityId,
      introductionId,
      startsAt: "2031-08-15T03:00:00.000Z",
      endsAt: "2031-08-15T04:00:00.000Z",
      timezone: "Asia/Jakarta",
      meetingUrl: null,
    });
    meetingIds.push(cancellable.id);
    expect((await cancelMeeting(buyerUserId, buyerId, cancellable.id)).status).toBe("CANCELLED");
    expect((await cancelMeeting(buyerUserId, buyerId, cancellable.id)).status).toBe("CANCELLED");
  });

  it("creates and scopes notification read operations to their recipient", async () => {
    const providerNotifications = await listNotifications(providerUserId, { limit: 100 });
    const notification = providerNotifications.items.find((item) => item.type === "MEETING");
    expect(notification).toBeTruthy();
    await expect(readNotification(unrelatedUserId, notification!.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await readNotification(providerUserId, notification!.id)).read).toBe(true);
    expect((await readAllNotifications(providerUserId)).updated).toBeGreaterThanOrEqual(0);
  });
});
