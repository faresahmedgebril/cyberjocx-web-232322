import crypto from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { labInstances, labTemplates, labFlags } from "../../../drizzle/schema";
import { getDb } from "../../db";
import { queue } from "../../infrastructure/queue/provider";
import { labProvider } from "../../infrastructure/labs/provider";
import { validationError } from "../../core/errors";
import { awardChallengeCompletion } from "../practice/service";

export async function listLabTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: labTemplates.id,
    slug: labTemplates.slug,
    name: labTemplates.name,
    description: labTemplates.description,
    cpuLimit: labTemplates.cpuLimit,
    memoryMb: labTemplates.memoryMb,
    diskMb: labTemplates.diskMb,
    ttlSeconds: labTemplates.ttlSeconds,
    exposedPortsJson: labTemplates.exposedPortsJson,
  }).from(labTemplates).where(eq(labTemplates.active, true));
}

export async function startLab(userId: number, templateId: number, challengeId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const template = (await db.select().from(labTemplates).where(and(eq(labTemplates.id, templateId), eq(labTemplates.active, true))).limit(1))[0];
  if (!template) throw validationError("Lab template not found");

  const active = await db.select({ id: labInstances.id }).from(labInstances).where(and(
    eq(labInstances.userId, userId),
    eq(labInstances.templateId, templateId),
    gt(labInstances.expiresAt, new Date()),
  )).limit(1);
  if (active[0]) throw validationError("You already have an active lab for this template");

  const instanceId = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  const expiresAt = new Date(Date.now() + Math.min(template.ttlSeconds, 4 * 60 * 60) * 1000);
  const result = await db.insert(labInstances).values({
    instanceId,
    templateId,
    userId,
    challengeId: challengeId ?? null,
    status: "REQUESTED",
    expiresAt,
  });
  const id = Number(result[0].insertId);
  await queue.enqueue("lab-provision", { labInstanceId: id, instanceId });
  return { id, instanceId, status: "REQUESTED" as const, expiresAt };
}

export async function provisionLab(labInstanceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const instance = (await db.select().from(labInstances).where(eq(labInstances.id, labInstanceId)).limit(1))[0];
  if (!instance) return;
  const template = (await db.select().from(labTemplates).where(eq(labTemplates.id, instance.templateId)).limit(1))[0];
  if (!template) throw new Error("Lab template not found");

  await db.update(labInstances).set({ status: "PROVISIONING" }).where(eq(labInstances.id, labInstanceId));
  try {
    const ports = JSON.parse(template.exposedPortsJson) as number[];
    const provisioned = await labProvider.provision({
      instanceId: instance.instanceId,
      templateSlug: template.slug,
      userId: instance.userId,
      cpuLimit: template.cpuLimit,
      memoryMb: template.memoryMb,
      diskMb: template.diskMb,
      pidLimit: template.pidLimit,
      ttlSeconds: template.ttlSeconds,
      exposedPorts: Array.isArray(ports) ? ports : [],
    });
    await db.update(labInstances).set({
      status: "READY",
      targetUrl: provisioned.targetUrl,
      containerRef: provisioned.containerRef ?? null,
    }).where(eq(labInstances.id, labInstanceId));
  } catch (error) {
    await db.update(labInstances).set({ status: "FAILED" }).where(eq(labInstances.id, labInstanceId));
    throw error;
  }
}

export async function submitLabFlag(userId: number, instanceId: number, flag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const instance = (await db.select().from(labInstances).where(and(eq(labInstances.id, instanceId), eq(labInstances.userId, userId))).limit(1))[0];
  if (!instance) throw validationError("Lab instance not found");
  if (!["READY", "RUNNING"].includes(instance.status)) throw validationError("Lab is not accepting submissions");
  const expected = (await db.select().from(labFlags).where(eq(labFlags.labInstanceId, instance.id)).limit(1))[0];
  if (!expected) return { correct: false };
  const hash = crypto.createHash("sha256").update(flag.trim(), "utf8").digest("hex");
  const correct = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected.flagHash));
  if (correct) {
    await db.update(labInstances).set({ status: "COMPLETED" }).where(eq(labInstances.id, instance.id));
    if (instance.challengeId) await awardChallengeCompletion(userId, instance.challengeId, "lab");
  }
  return { correct };
}

export async function destroyLab(labInstanceId: number) {
  const db = await getDb();
  if (!db) return;
  const instance = (await db.select().from(labInstances).where(eq(labInstances.id, labInstanceId)).limit(1))[0];
  if (!instance) return;
  await labProvider.destroy(instance.instanceId);
  await db.update(labInstances).set({ status: "DESTROYED" }).where(eq(labInstances.id, labInstanceId));
}

export async function cleanupExpiredLabs() {
  const db = await getDb();
  if (!db) return 0;
  const expired = await db.select().from(labInstances).where(lt(labInstances.expiresAt, new Date()));
  let cleaned = 0;
  for (const instance of expired) {
    if (["DESTROYED", "CLEANUP"].includes(instance.status)) continue;
    try { await labProvider.destroy(instance.instanceId); } catch {}
    await db.update(labInstances).set({ status: "DESTROYED" }).where(eq(labInstances.id, instance.id));
    cleaned += 1;
  }
  return cleaned;
}
