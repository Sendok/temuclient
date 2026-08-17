import { z } from "zod";

export const notificationListQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
