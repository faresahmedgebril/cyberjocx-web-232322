import crypto from "node:crypto";
import { and, asc, eq, lte } from "drizzle-orm";
import { jobs } from "../../../drizzle/schema";
import { getDb } from "../../db";

export type JobName = "nvd-sync" | "notifications";
export type Job = { id: string; name: JobName; payload: Record<string, unknown>; createdAt: Date };

export interface QueueProvider {
  enqueue(name: JobName, payload?: Record<string, unknown>): Promise<Job>;
  claim(name?: JobName): Promise<Job | undefined>;
  complete(id: string): Promise<void>;
  fail(id: string, message: string): Promise<void>;
}

export class DatabaseQueue implements QueueProvider {
  async enqueue(name: JobName, payload: Record<string, unknown> = {}) {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const id = crypto.randomUUID();
    const createdAt = new Date();
    await db.insert(jobs).values({ jobId: id, name, payloadJson: JSON.stringify(payload), createdAt });
    return { id, name, payload, createdAt };
  }
  async claim(name?: JobName) {
    const db = await getDb();
    if (!db) return undefined;
    const conditions = [eq(jobs.status, "queued"), lte(jobs.availableAt, new Date())];
    if (name) conditions.push(eq(jobs.name, name));
    const row = (await db.select().from(jobs).where(and(...conditions)).orderBy(asc(jobs.createdAt)).limit(1))[0];
    if (!row) return undefined;
    await db.update(jobs).set({ status: "running", startedAt: new Date(), attempts: row.attempts + 1 }).where(and(eq(jobs.id, row.id), eq(jobs.status, "queued")));
    return { id: row.jobId, name: row.name as JobName, payload: JSON.parse(row.payloadJson) as Record<string, unknown>, createdAt: row.createdAt };
  }
  async complete(id: string) { const db = await getDb(); if (db) await db.update(jobs).set({ status: "completed", completedAt: new Date() }).where(eq(jobs.jobId, id)); }
  async fail(id: string, message: string) { const db = await getDb(); if (db) await db.update(jobs).set({ status: "failed", completedAt: new Date(), errorMessage: message }).where(eq(jobs.jobId, id)); }
}

export const queue: QueueProvider = new DatabaseQueue();
