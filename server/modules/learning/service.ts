import { and, eq, desc } from "drizzle-orm";
import { assessmentAttempts, assessmentQuestions, assessments, onboardingProfiles, skills, userSkills } from "../../../drizzle/schema";
import { getDb } from "../../db";
import { validationError } from "../../core/errors";

export async function getOnboarding(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  return (await db.select().from(onboardingProfiles).where(eq(onboardingProfiles.userId, userId)).limit(1))[0];
}

export async function saveOnboarding(userId: number, input: { level: string; interests: string[]; goal: string; studyTime: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const existing = (await db.select().from(onboardingProfiles).where(eq(onboardingProfiles.userId, userId)).limit(1))[0];
  if (existing) {
    await db.update(onboardingProfiles).set({ level: input.level, interestsJson: JSON.stringify(input.interests), goal: input.goal, studyTime: input.studyTime }).where(eq(onboardingProfiles.id, existing.id));
    return existing.id;
  }
  const result = await db.insert(onboardingProfiles).values({ userId, level: input.level, interestsJson: JSON.stringify(input.interests), goal: input.goal, studyTime: input.studyTime });
  return Number(result[0].insertId);
}

export async function listAssessments() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: assessments.id, slug: assessments.slug, title: assessments.title }).from(assessments).where(eq(assessments.active, true));
}

export async function getAssessment(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const assessment = (await db.select().from(assessments).where(and(eq(assessments.id, id), eq(assessments.active, true))).limit(1))[0];
  if (!assessment) return undefined;
  const questions = await db.select({
    id: assessmentQuestions.id,
    skillId: assessmentQuestions.skillId,
    prompt: assessmentQuestions.prompt,
    optionsJson: assessmentQuestions.optionsJson,
    orderIndex: assessmentQuestions.orderIndex,
    weight: assessmentQuestions.weight,
  }).from(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, id)).orderBy(assessmentQuestions.orderIndex);
  return { assessment, questions };
}

export async function submitAssessment(userId: number, assessmentId: number, answers: number[]) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const questions = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, assessmentId)).orderBy(assessmentQuestions.orderIndex);
  if (!questions.length || answers.length !== questions.length) throw validationError("Assessment answers are incomplete.");
  const grouped = new Map<number, { score: number; total: number }>();
  let earned = 0; let total = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]; const weight = Math.max(1, q.weight); total += weight;
    const bucket = grouped.get(q.skillId) ?? { score: 0, total: 0 }; bucket.total += weight;
    if (answers[i] === q.answerIndex) { earned += weight; bucket.score += weight; }
    grouped.set(q.skillId, bucket);
  }
  const overall = Math.round((earned / total) * 100);
  const skillIds = Array.from(grouped.keys());
  const skillRows = skillIds.length ? await db.select().from(skills) : [];
  const skillProfile = skillIds.map(skillId => {
    const bucket = grouped.get(skillId)!;
    return { skillId, name: skillRows.find(s => s.id === skillId)?.name ?? "Unknown skill", score: Math.round((bucket.score / bucket.total) * 100) };
  });
  await db.transaction(async tx => {
    await tx.insert(assessmentAttempts).values({ assessmentId, userId, score: overall, skillProfileJson: JSON.stringify(skillProfile) });
    for (const item of skillProfile) {
      const existing = (await tx.select().from(userSkills).where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, item.skillId))).limit(1))[0];
      if (existing) await tx.update(userSkills).set({ score: Math.max(existing.score, item.score), evidenceCount: existing.evidenceCount + 1 }).where(eq(userSkills.id, existing.id));
      else await tx.insert(userSkills).values({ userId, skillId: item.skillId, score: item.score, evidenceCount: 1 });
    }
  });
  return { score: overall, skillProfile };
}

export async function latestAssessment(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  return (await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.userId, userId)).orderBy(desc(assessmentAttempts.createdAt)).limit(1))[0];
}
