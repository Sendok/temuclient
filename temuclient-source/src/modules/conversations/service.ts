import { DomainError } from "@/lib/errors/domain-error";
import type {
  ConversationListQuery,
  MessageListQuery,
  SendMessageInput,
} from "@/modules/conversations/schema";
import { db } from "@/server/db/client";

type ConversationSummarySource = {
  id: string;
  introductionId: string | null;
  updatedAt: Date;
  opportunity: { id: string; title: string; status: string } | null;
  introduction: { status: string } | null;
  participants: Array<{
    userId: string;
    user: { id: string; name: string; email: string };
    organization: { id: string; name: string; type: string; logoUrl: string | null };
  }>;
  messages?: Array<{ id: string; body: string; senderUserId: string; createdAt: Date }>;
};

type MessageDtoSource = {
  id: string;
  conversationId: string;
  body: string;
  type: string;
  senderOrganizationId: string;
  sender: { id: string; name: string };
  replyTo: { id: string; body: string; sender: { name: string } } | null;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
};

const participantInclude = {
  user: { select: { id: true, name: true, email: true } },
  organization: { select: { id: true, name: true, type: true, logoUrl: true } },
} as const;

export async function listConversations(
  userId: string,
  organizationId: string,
  query: ConversationListQuery = {},
) {
  const memberships = await db.conversationParticipant.findMany({
    where: {
      userId,
      organizationId,
      conversation: { opportunityId: query.opportunityId },
    },
    include: {
      conversation: {
        include: {
          opportunity: { select: { id: true, title: true, status: true } },
          introduction: {
            select: {
              id: true,
              status: true,
              buyerOrganizationId: true,
              providerOrganizationId: true,
            },
          },
          participants: { include: participantInclude },
          messages: {
            where: { deletedAt: null },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 1,
            select: { id: true, body: true, senderUserId: true, createdAt: true },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
    take: 51,
    ...(query.cursor
      ? { cursor: { conversationId_userId: { conversationId: query.cursor, userId } }, skip: 1 }
      : {}),
  });
  const ids = memberships.map((item) => item.conversationId);
  const incoming = ids.length
    ? await db.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: ids },
          senderUserId: { not: userId },
          deletedAt: null,
          OR: memberships.map((membership) => ({
            conversationId: membership.conversationId,
            createdAt: membership.lastReadAt
              ? { gt: membership.lastReadAt }
              : undefined,
          })),
        },
        _count: { _all: true },
      })
    : [];
  const items = memberships.slice(0, 50).map((membership) => {
    const unreadCount =
      incoming.find((group) => group.conversationId === membership.conversationId)
        ?._count._all ?? 0;
    return toConversationSummary(membership.conversation, userId, unreadCount);
  });
  const filtered = query.unreadOnly ? items.filter((item) => item.unreadCount > 0) : items;
  return {
    items: filtered,
    nextCursor: memberships.length > 50 ? memberships[49].conversationId : null,
  };
}

export async function getConversation(
  userId: string,
  organizationId: string,
  conversationId: string,
) {
  const participant = await requireParticipant(userId, organizationId, conversationId);
  const conversation = await db.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          status: true,
          problemStatement: true,
          buyerOrganization: { select: { id: true, name: true } },
        },
      },
      introduction: {
        select: {
          id: true,
          status: true,
          buyerOrganizationId: true,
          providerOrganizationId: true,
        },
      },
      participants: { include: participantInclude },
    },
  });
  const latestMeeting = conversation.introductionId
    ? await db.meeting.findFirst({
        where: {
          introductionId: conversation.introductionId,
          participants: { some: { userId } },
        },
        orderBy: { startsAt: "desc" },
        select: { id: true, title: true, startsAt: true, status: true },
      })
    : null;
  return {
    ...toConversationSummary(conversation, userId, 0),
    lastReadAt: participant.lastReadAt?.toISOString() ?? null,
    problemStatement: conversation.opportunity?.problemStatement ?? null,
    meeting: latestMeeting
      ? { ...latestMeeting, startsAt: latestMeeting.startsAt.toISOString() }
      : null,
  };
}

export async function listMessages(
  userId: string,
  organizationId: string,
  conversationId: string,
  query: MessageListQuery,
) {
  await requireParticipant(userId, organizationId, conversationId);
  const rows = await db.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, name: true } },
      replyTo: {
        select: {
          id: true,
          body: true,
          sender: { select: { name: true } },
        },
      },
    },
  });
  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
  return {
    items: rows.slice(0, query.limit).reverse().map(toMessageDto),
    nextCursor: rows.length > query.limit ? rows[query.limit - 1].id : null,
  };
}

export async function sendMessage(
  userId: string,
  organizationId: string,
  conversationId: string,
  input: SendMessageInput,
) {
  return db.$transaction(async (transaction) => {
    const participant = await transaction.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      include: {
        conversation: {
          include: {
            introduction: { select: { status: true } },
            opportunity: { select: { title: true } },
          },
        },
      },
    });
    if (!participant || participant.organizationId !== organizationId)
      throw new DomainError("FORBIDDEN", "Anda bukan peserta percakapan ini.", 403);
    if (participant.conversation.introduction?.status !== "ACCEPTED")
      throw new DomainError("CONVERSATION_INACTIVE", "Percakapan belum aktif.", 409);
    if (input.replyToId) {
      const reply = await transaction.message.findUnique({ where: { id: input.replyToId } });
      if (!reply || reply.conversationId !== conversationId)
        throw new DomainError("VALIDATION_ERROR", "Pesan balasan tidak valid.", 400, {
          replyToId: "Pesan harus berasal dari percakapan yang sama.",
        });
    }
    const message = await transaction.message.create({
      data: {
        conversationId,
        senderUserId: userId,
        senderOrganizationId: organizationId,
        body: input.body,
        replyToId: input.replyToId ?? null,
      },
      include: {
        sender: { select: { id: true, name: true } },
        replyTo: { select: { id: true, body: true, sender: { select: { name: true } } } },
      },
    });
    const recipients = await transaction.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
      select: { userId: true },
    });
    if (recipients.length)
      await transaction.notification.createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.userId,
          type: "MESSAGE" as const,
          title: "Pesan baru",
          body: `Pesan baru pada ${participant.conversation.opportunity?.title ?? "percakapan Introduction"}.`,
          entityType: "Conversation",
          entityId: conversationId,
        })),
      });
    await transaction.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    await transaction.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: message.createdAt },
    });
    await transaction.auditLog.create({
      data: {
        actorUserId: userId,
        actorOrganizationId: organizationId,
        action: "MESSAGE_SENT",
        entityType: "Message",
        entityId: message.id,
        metadataJson: { conversationId },
      },
    });
    await transaction.analyticsEvent.create({ data: { name: "message_sent", userId, organizationId, entityType: "Message", entityId: message.id, propertiesJson: { conversationId } } });
    return toMessageDto(message);
  });
}

async function requireParticipant(userId: string, organizationId: string, conversationId: string) {
  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant || participant.organizationId !== organizationId)
    throw new DomainError("FORBIDDEN", "Anda bukan peserta percakapan ini.", 403);
  return participant;
}

function toConversationSummary(conversation: ConversationSummarySource, userId: string, unreadCount: number) {
  const counterpart = conversation.participants.find((item) => item.userId !== userId);
  const lastMessage = conversation.messages?.[0];
  return {
    id: conversation.id,
    opportunity: conversation.opportunity
      ? { id: conversation.opportunity.id, title: conversation.opportunity.title, status: conversation.opportunity.status }
      : null,
    introductionId: conversation.introductionId,
    introductionStatus: conversation.introduction?.status ?? null,
    counterpart: counterpart
      ? { user: counterpart.user, organization: counterpart.organization }
      : null,
    participants: conversation.participants.map((item) => ({
      user: item.user,
      organization: item.organization,
    })),
    lastMessage: lastMessage
      ? { ...lastMessage, createdAt: lastMessage.createdAt.toISOString() }
      : null,
    unreadCount,
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

function toMessageDto(message: MessageDtoSource) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    body: message.deletedAt ? "Pesan telah dihapus." : message.body,
    type: message.type,
    sender: message.sender,
    senderOrganizationId: message.senderOrganizationId,
    replyTo: message.replyTo
      ? { id: message.replyTo.id, body: message.replyTo.body, senderName: message.replyTo.sender.name }
      : null,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    deletedAt: message.deletedAt?.toISOString() ?? null,
  };
}

export type ConversationListData = Awaited<ReturnType<typeof listConversations>>;
export type ConversationData = Awaited<ReturnType<typeof getConversation>>;
export type MessageListData = Awaited<ReturnType<typeof listMessages>>;
