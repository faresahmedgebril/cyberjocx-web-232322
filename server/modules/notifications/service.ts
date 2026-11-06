import { and, eq } from "drizzle-orm";
import { notifications, users } from "../../../drizzle/schema";
import { getDb } from "../../db";

export const NOTIFICATIONS_ENABLED = false;

export type NotificationInput = {
  type: "cve" | "content" | "system";
  title: string;
  message: string;
};

export async function notifyUsers(userIds: number[], input: NotificationInput) {
  if (!NOTIFICATIONS_ENABLED) return 0;
  const db = await getDb();
  if (!db || userIds.length === 0) return 0;
  await db.insert(notifications).values(userIds.map(userId => ({ userId, ...input })));
  return userIds.length;
}

export async function notifyAll(input: NotificationInput) {
  if (!NOTIFICATIONS_ENABLED) return 0;
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: users.id }).from(users);
  return notifyUsers(rows.map(user => user.id), input);
}

/**
 * Broadcast several distinct events while bounding each INSERT payload.
 * Each event is persisted once per registered user; callers should only pass
 * genuinely new events (not periodic refreshes of existing content).
 */
export async function notifyAllMany(inputs: NotificationInput[]) {
  if (!NOTIFICATIONS_ENABLED) return 0;
  const db = await getDb();
  if (!db || inputs.length === 0) return 0;
  const recipients = await db.select({ id: users.id }).from(users);
  if (recipients.length === 0) return 0;

  let inserted = 0;
  const batch: Array<typeof notifications.$inferInsert> = [];
  const flush = async () => {
    if (!batch.length) return;
    await db.insert(notifications).values([...batch]);
    inserted += batch.length;
    batch.length = 0;
  };

  for (const event of inputs) {
    for (const recipient of recipients) {
      batch.push({ userId: recipient.id, ...event });
      if (batch.length >= 1000) await flush();
    }
  }
  await flush();
  return inserted;
}

export async function markNotificationRead(userId: number, id: number) {
  if (!NOTIFICATIONS_ENABLED) return false;
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return true;
}

export async function markAllNotificationsRead(userId: number) {
  if (!NOTIFICATIONS_ENABLED) return false;
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return true;
}
