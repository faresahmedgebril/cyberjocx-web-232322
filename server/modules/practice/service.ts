import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { challenges, challengeSubmissions, skillEvidence, userSkills, users, xpTransactions } from "../../../drizzle/schema";
import { getDb } from "../../db";
import { validationError } from "../../core/errors";

function hashAnswer(value: string) {
  return crypto.createHash("sha256").update(value.trim(), "utf8").digest("hex");
}

export async function listChallenges(input?: { type?: "basic" | "static" | "ctf" | "lab"; difficulty?: "beginner" | "intermediate" | "advanced" }) {
  const db = await getDb();
  if (!db) return [];
  const filters = [eq(challenges.active, true)];
  if (input?.type) filters.push(eq(challenges.type, input.type));
  if (input?.difficulty) filters.push(eq(challenges.difficulty, input.difficulty));
  return db.select({
    id: challenges.id,
    slug: challenges.slug,
    title: challenges.title,
    description: challenges.description,
    type: challenges.type,
    difficulty: challenges.difficulty,
    points: challenges.points,
    validationMode: challenges.validationMode,
    hintText: challenges.hintText,
    skillId: challenges.skillId,
  }).from(challenges).where(and(...filters)).orderBy(desc(challenges.createdAt));
}

export async function getChallenge(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select({
    id: challenges.id,
    slug: challenges.slug,
    title: challenges.title,
    description: challenges.description,
    type: challenges.type,
    difficulty: challenges.difficulty,
    points: challenges.points,
    validationMode: challenges.validationMode,
    hintText: challenges.hintText,
    skillId: challenges.skillId,
  }).from(challenges).where(and(eq(challenges.id, id), eq(challenges.active, true))).limit(1))[0];
}

export async function submitChallenge(userId: number, challengeId: number, answer: string) {
  const normalized = answer.trim();
  if (normalized.length < 1 || normalized.length > 512) throw validationError("Submission must be between 1 and 512 characters.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const challenge = (await db.select().from(challenges).where(and(eq(challenges.id, challengeId), eq(challenges.active, true))).limit(1))[0];
  if (!challenge) return { correct: false, completed: false, awardedXp: 0 };

  const answerHash = hashAnswer(normalized);
  const correct = Boolean(challenge.expectedHash && crypto.timingSafeEqual(Buffer.from(answerHash), Buffer.from(challenge.expectedHash)));

  const priorCorrect = (await db.select({ id: challengeSubmissions.id }).from(challengeSubmissions).where(and(
    eq(challengeSubmissions.challengeId, challengeId),
    eq(challengeSubmissions.userId, userId),
    eq(challengeSubmissions.correct, true),
  )).limit(1))[0];

  await db.insert(challengeSubmissions).values({ challengeId, userId, answerHash, correct });

  if (!correct || priorCorrect) return { correct, completed: Boolean(priorCorrect) || correct, awardedXp: 0 };

  await db.transaction(async tx => {
    await tx.insert(xpTransactions).values({ userId, amount: challenge.points, sourceType: "challenge", sourceId: challenge.id });
    const currentUser = (await tx.select({ points: users.points }).from(users).where(eq(users.id, userId)).limit(1))[0];
    await tx.update(users).set({ points: (currentUser?.points ?? 0) + challenge.points }).where(eq(users.id, userId));
    if (challenge.skillId) {
      const existing = (await tx.select().from(userSkills).where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, challenge.skillId))).limit(1))[0];
      if (existing) {
        const nextScore = Math.min(100, existing.score + Math.max(5, Math.min(20, challenge.points / 10)));
        await tx.update(userSkills).set({ score: nextScore, evidenceCount: existing.evidenceCount + 1 }).where(eq(userSkills.id, existing.id));
      } else {
        await tx.insert(userSkills).values({ userId, skillId: challenge.skillId, score: Math.min(100, Math.max(5, challenge.points / 10)), evidenceCount: 1 });
      }
      await tx.insert(skillEvidence).values({
        userId,
        skillId: challenge.skillId,
        sourceType: "challenge",
        sourceId: challenge.id,
        result: "success",
        difficulty: challenge.difficulty,
        metadataJson: JSON.stringify({ points: challenge.points }),
      });
    }
  });

  return { correct: true, completed: true, awardedXp: challenge.points };
}

export async function createChallenge(input: {
  slug: string;
  title: string;
  description: string;
  type: "basic" | "static" | "ctf" | "lab";
  difficulty: "beginner" | "intermediate" | "advanced";
  points: number;
  validationMode: "STATIC_FLAG" | "SERVER_VALIDATOR" | "LAB_FLAG" | "AUTOMATED_TEST" | "PROJECT_CHECK";
  expectedAnswer?: string;
  hintText?: string;
  skillId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.validationMode !== "STATIC_FLAG" && input.expectedAnswer) throw validationError("Only STATIC_FLAG challenges accept an expected answer in the basic creator.");
  const expectedHash = input.expectedAnswer ? hashAnswer(input.expectedAnswer) : null;
  const result = await db.insert(challenges).values({
    slug: input.slug.trim(),
    title: input.title.trim(),
    description: input.description,
    type: input.type,
    difficulty: input.difficulty,
    points: input.points,
    validationMode: input.validationMode,
    expectedHash,
    hintText: input.hintText ?? null,
    skillId: input.skillId ?? null,
    active: true,
  });
  return { id: Number(result[0].insertId) };
}
