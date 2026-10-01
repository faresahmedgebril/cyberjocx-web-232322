import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { challenges, ctfChallenges, ctfEvents, ctfSubmissions } from "../../../drizzle/schema";
import { getDb } from "../../db";
import { awardChallengeCompletion } from "../practice/service";
import { validationError } from "../../core/errors";

export async function listCtfEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ctfEvents).where(eq(ctfEvents.active, true)).orderBy(desc(ctfEvents.startsAt));
}

export async function getCtfEvent(eventId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const event = (await db.select().from(ctfEvents).where(and(eq(ctfEvents.id, eventId), eq(ctfEvents.active, true))).limit(1))[0];
  if (!event) return undefined;
  const rows = await db.select({
    id: ctfChallenges.id,
    category: ctfChallenges.category,
    orderIndex: ctfChallenges.orderIndex,
    challenge: {
      id: challenges.id,
      title: challenges.title,
      description: challenges.description,
      difficulty: challenges.difficulty,
      points: challenges.points,
    },
  }).from(ctfChallenges).innerJoin(challenges, eq(ctfChallenges.challengeId, challenges.id)).where(eq(ctfChallenges.eventId, eventId)).orderBy(ctfChallenges.orderIndex);
  return { event, challenges: rows };
}

export async function submitCtfFlag(userId: number, eventId: number, challengeId: number, flag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const link = (await db.select().from(ctfChallenges).where(and(eq(ctfChallenges.eventId, eventId), eq(ctfChallenges.challengeId, challengeId))).limit(1))[0];
  if (!link) throw validationError("CTF challenge not found");
  const challenge = (await db.select().from(challenges).where(and(eq(challenges.id, challengeId), eq(challenges.active, true))).limit(1))[0];
  if (!challenge) throw validationError("Challenge not found");
  const hash = crypto.createHash("sha256").update(flag.trim(), "utf8").digest("hex");
  const correct = Boolean(challenge.expectedHash && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(challenge.expectedHash)));
  await db.insert(ctfSubmissions).values({ eventId, challengeId, userId, answerHash: hash, correct });
  const reward = correct ? await awardChallengeCompletion(userId, challengeId, "ctf") : { awardedXp: 0 };
  return { correct, awardedXp: reward.awardedXp };
}
