import { and, desc, eq } from "drizzle-orm";
import { challengeSubmissions, certificates, courses, courseProgress, labInstances, portfolios, projectSubmissions, skillEvidence, skills, userSkills } from "../../../drizzle/schema";
import { getDb, getUserById } from "../../db";

export async function getPortfolio(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const user = await getUserById(userId);
  if (!user) return undefined;
  const [skillRows, evidenceRows, challengeRows, labRows, projectRows, certificateRows] = await Promise.all([
    db.select({ skill: skills, userSkill: userSkills }).from(userSkills).innerJoin(skills, eq(userSkills.skillId, skills.id)).where(eq(userSkills.userId, userId)).orderBy(desc(userSkills.score)),
    db.select().from(skillEvidence).where(eq(skillEvidence.userId, userId)).orderBy(desc(skillEvidence.createdAt)).limit(100),
    db.select({ id: challengeSubmissions.id }).from(challengeSubmissions).where(and(eq(challengeSubmissions.userId, userId), eq(challengeSubmissions.correct, true))),
    db.select({ id: labInstances.id }).from(labInstances).where(and(eq(labInstances.userId, userId), eq(labInstances.status, "COMPLETED"))),
    db.select({ id: projectSubmissions.id, title: projectSubmissions.projectId, score: projectSubmissions.score }).from(projectSubmissions).where(and(eq(projectSubmissions.userId, userId), eq(projectSubmissions.status, "accepted"))),
    db.select().from(certificates).where(eq(certificates.userId, userId)),
  ]);
  return {
    profile: { id: user.id, name: user.name, avatarUrl: user.avatarUrl, memberRank: user.memberRank },
    skills: skillRows.map(row => ({ ...row.skill, score: row.userSkill.score, evidenceCount: row.userSkill.evidenceCount })),
    evidence: evidenceRows,
    practicalEvidence: { challenges: challengeRows.length, labs: labRows.length, projects: projectRows.length },
    certificates: certificateRows,
  };
}

export async function ensurePortfolio(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = (await db.select().from(portfolios).where(eq(portfolios.userId, userId)).limit(1))[0];
  if (existing) return existing;
  const user = await getUserById(userId);
  const slug = `user-${userId}-${cryptoSlug(user?.name ?? "learner")}`;
  await db.insert(portfolios).values({ userId, slug, headline: user?.name ? `${user.name} — Cybersecurity Portfolio` : "Cybersecurity Portfolio", public: true });
  return (await db.select().from(portfolios).where(eq(portfolios.userId, userId)).limit(1))[0];
}

function cryptoSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "learner";
}
