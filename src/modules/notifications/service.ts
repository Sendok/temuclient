import { DomainError } from "@/lib/errors/domain-error";
import type { NotificationListQuery } from "@/modules/notifications/schema";
import { db } from "@/server/db/client";

export async function listNotifications(userId: string, query: NotificationListQuery) {
  const rows = await db.notification.findMany({
    where: { userId, readAt: query.unreadOnly ? null : undefined },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });
  return {
    items: rows.slice(0, query.limit).map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      readAt: item.readAt?.toISOString() ?? null,
    })),
    unreadCount: await db.notification.count({ where: { userId, readAt: null } }),
    nextCursor: rows.length > query.limit ? rows[query.limit - 1].id : null,
  };
}

export async function readNotification(userId: string, id: string) {
  const result = await db.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
  if (!result.count)
    throw new DomainError("NOT_FOUND", "Notifikasi tidak ditemukan.", 404);
  return { id, read: true };
}

export async function readAllNotifications(userId: string) {
  const result = await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}

export type NotificationListData = Awaited<ReturnType<typeof listNotifications>>;
