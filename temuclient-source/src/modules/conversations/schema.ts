import { z } from "zod";

export const conversationListQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  opportunityId: z.string().trim().min(1).optional(),
  cursor: z.string().trim().min(1).optional(),
});

export const messageListQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Pesan tidak boleh kosong.").max(4000),
  replyToId: z.string().trim().min(1).nullable().optional(),
});

export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>;
export type MessageListQuery = z.infer<typeof messageListQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
