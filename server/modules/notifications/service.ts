import { and, eq } from "drizzle-orm";
import { notifications, users } from "../../../drizzle/schema";
import { getDb } from "../../db";

export async function notifyUsers(userIds: number[], input: { type: "cve" | "content" | "system"; title: string; message: string }) {
  const db = await getDb();
  if (!db || userIds.length === 0) return 0;
  await db.insert(notifications).values(userIds.map(userId => ({ userId, ...input })));
  return userIds.length;
}

export async function notifyAll(input: { type: "cve" | "content" | "system"; title: string; message: string }) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: users.id }).from(users);
  return notifyUsers(rows.map(user => user.id), input);
}

export async function markNotificationRead(userId: number, id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return true;
}
