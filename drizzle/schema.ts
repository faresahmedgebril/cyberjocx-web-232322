import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const usersRolePgEnum = pgEnum("users_role_enum", ["user", "admin"]);
export const usersMemberRankPgEnum = pgEnum("users_memberRank_enum", ["learner", "contributor", "analyst", "mentor", "elite"]);
export const coursesLevelPgEnum = pgEnum("courses_level_enum", ["beginner", "intermediate", "advanced"]);
export const cvesSeverityPgEnum = pgEnum("cves_severity_enum", ["critical", "high", "medium", "low"]);
export const trackLevelsLevelKeyPgEnum = pgEnum("trackLevels_levelKey_enum", ["beginner", "junior", "mid", "senior", "professional"]);
export const friendRequestsStatusPgEnum = pgEnum("friendRequests_status_enum", ["pending", "accepted", "declined"]);
export const malwareFamiliesSeverityPgEnum = pgEnum("malwareFamilies_severity_enum", ["critical", "high", "medium", "low"]);
export const notificationsTypePgEnum = pgEnum("notifications_type_enum", ["cve", "content", "system"]);
export const jobsStatusPgEnum = pgEnum("jobs_status_enum", ["queued", "running", "completed", "failed"]);
export const challengesTypePgEnum = pgEnum("challenges_type_enum", ["basic", "static", "ctf", "lab"]);
export const challengesDifficultyPgEnum = pgEnum("challenges_difficulty_enum", ["beginner", "intermediate", "advanced"]);
export const challengesValidationModePgEnum = pgEnum("challenges_validationMode_enum", ["STATIC_FLAG", "SERVER_VALIDATOR", "LAB_FLAG", "AUTOMATED_TEST", "PROJECT_CHECK"]);
export const skillEvidenceResultPgEnum = pgEnum("skillEvidence_result_enum", ["success", "partial", "failed"]);
export const skillEvidenceDifficultyPgEnum = pgEnum("skillEvidence_difficulty_enum", ["beginner", "intermediate", "advanced"]);
export const labInstancesStatusPgEnum = pgEnum("labInstances_status_enum", ["REQUESTED", "PROVISIONING", "READY", "RUNNING", "COMPLETED", "EXPIRED", "CLEANUP", "DESTROYED", "FAILED"]);
export const projectSubmissionsStatusPgEnum = pgEnum("projectSubmissions_status_enum", ["submitted", "reviewed", "accepted", "rejected"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  passwordResetTokenHash: varchar("passwordResetTokenHash", { length: 128 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
  role: usersRolePgEnum("role").default("user").notNull(),
  points: integer("points").default(0).notNull(),
  isVip: boolean("isVip").default(false).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  bannerUrl: text("bannerUrl"),
  phone: varchar("phone", { length: 32 }),
  linkedinUrl: text("linkedinUrl"),
  memberRank: usersMemberRankPgEnum("memberRank").default("learner").notNull(),
  primaryTrackId: integer("primaryTrackId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  userAgent: varchar("userAgent", { length: 512 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  level: coursesLevelPgEnum("level").default("beginner").notNull(),
  instructor: varchar("instructor", { length: 255 }).notNull(),
  lessons: integer("lessons").default(8).notNull(),
  durationMinutes: integer("durationMinutes").default(240).notNull(),
  requiredPoints: integer("requiredPoints").default(0).notNull(),
  coverUrl: text("coverUrl"),
  courseUrl: text("courseUrl"),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const roadmaps = pgTable("roadmaps", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  focus: varchar("focus", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const roadmapCourses = pgTable("roadmapCourses", {
  id: serial("id").primaryKey(),
  roadmapId: integer("roadmapId").notNull(),
  courseId: integer("courseId").notNull(),
  orderIndex: integer("orderIndex").default(0).notNull(),
});

export const courseProgress = pgTable("courseProgress", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  courseId: integer("courseId").notNull(),
  progress: integer("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const cves = pgTable("cves", {
  id: serial("id").primaryKey(),
  cveNumber: varchar("cveNumber", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  severity: cvesSeverityPgEnum("severity").notNull(),
  cvss: varchar("cvss", { length: 8 }).notNull(),
  publishedDate: varchar("publishedDate", { length: 32 }).notNull(),
  affected: varchar("affected", { length: 255 }).notNull(),
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  commands: text("commands"),
  downloadUrl: text("downloadUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  outcome: text("outcome").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trackCourses = pgTable("trackCourses", {
  id: serial("id").primaryKey(),
  trackId: integer("trackId").notNull(),
  courseId: integer("courseId").notNull(),
  orderIndex: integer("orderIndex").default(0).notNull(),
});

export const trackTools = pgTable("trackTools", {
  id: serial("id").primaryKey(),
  trackId: integer("trackId").notNull(),
  toolId: integer("toolId").notNull(),
});

export const trackLevels = pgTable("trackLevels", {
  id: serial("id").primaryKey(),
  trackId: integer("trackId").notNull(),
  levelKey: trackLevelsLevelKeyPgEnum("levelKey").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  certificateName: varchar("certificateName", { length: 255 }).notNull(),
  orderIndex: integer("orderIndex").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trackLevelModules = pgTable("trackLevelModules", {
  id: serial("id").primaryKey(),
  trackLevelId: integer("trackLevelId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  actionItems: text("actionItems").notNull(),
  videoUrl: text("videoUrl"),
  orderIndex: integer("orderIndex").notNull(),
});

export const userTrackLevels = pgTable("userTrackLevels", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  trackId: integer("trackId").notNull(),
  currentLevel: integer("currentLevel").default(1).notNull(),
  completedLevelsJson: text("completedLevelsJson").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  likesCount: integer("likesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postLikes = pgTable("postLikes", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("followerId").notNull(),
  followingId: integer("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const friendRequests = pgTable("friendRequests", {
  id: serial("id").primaryKey(),
  senderId: integer("senderId").notNull(),
  recipientId: integer("recipientId").notNull(),
  status: friendRequestsStatusPgEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const malwareFamilies = pgTable("malwareFamilies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  severity: malwareFamiliesSeverityPgEnum("severity").notNull(),
  description: text("description").notNull(),
  targets: text("targets").notNull(),
  mitreTechniques: text("mitreTechniques").notNull(),
  sourceUrl: text("sourceUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  pricePoints: integer("pricePoints").default(100).notNull(),
  coverUrl: text("coverUrl"),
  downloadUrl: text("downloadUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const cartItems = pgTable("cartItems", {
  id: serial("id").primaryKey(),
  cartId: integer("cartId").notNull(),
  bookId: integer("bookId").notNull(),
  quantity: integer("quantity").default(1).notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  type: notificationsTypePgEnum("type").default("system").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trackQuizzes = pgTable("trackQuizzes", {
  id: serial("id").primaryKey(),
  trackId: integer("trackId").notNull(),
  trackLevelId: integer("trackLevelId"),
  title: varchar("title", { length: 255 }).notNull(),
  passingScore: integer("passingScore").default(70).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const quizQuestions = pgTable("quizQuestions", {
  id: serial("id").primaryKey(),
  quizId: integer("quizId").notNull(),
  prompt: text("prompt").notNull(),
  optionsJson: text("optionsJson").notNull(),
  answerIndex: integer("answerIndex").notNull(),
  orderIndex: integer("orderIndex").default(0).notNull(),
});

export const quizAttempts = pgTable("quizAttempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quizId").notNull(),
  userId: integer("userId").notNull(),
  score: integer("score").notNull(),
  passed: boolean("passed").default(false).notNull(),
  answersJson: text("answersJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  trackId: integer("trackId").notNull(),
  trackLevelId: integer("trackLevelId"),
  certificateCode: varchar("certificateCode", { length: 64 }).notNull().unique(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
});

export const nvdSyncSettings = pgTable("nvdSyncSettings", {
  id: serial("id").primaryKey(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastStartedAt: timestamp("lastStartedAt"),
  lastCompletedAt: timestamp("lastCompletedAt"),
  lastStatus: varchar("lastStatus", { length: 32 }).default("never").notNull(),
  lastImported: integer("lastImported").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const nvdSyncRuns = pgTable("nvdSyncRuns", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  status: varchar("status", { length: 32 }).notNull(),
  importedCount: integer("importedCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobId: varchar("jobId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  payloadJson: text("payloadJson").notNull(),
  status: jobsStatusPgEnum("status").default("queued").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const onboardingProfiles = pgTable("onboardingProfiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  level: varchar("level", { length: 32 }).notNull(),
  interestsJson: text("interestsJson").notNull(),
  goal: varchar("goal", { length: 80 }).notNull(),
  studyTime: varchar("studyTime", { length: 32 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const assessmentQuestions = pgTable("assessmentQuestions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessmentId").notNull(),
  skillId: integer("skillId").notNull(),
  prompt: text("prompt").notNull(),
  optionsJson: text("optionsJson").notNull(),
  answerIndex: integer("answerIndex").notNull(),
  weight: integer("weight").default(10).notNull(),
  orderIndex: integer("orderIndex").default(0).notNull(),
});

export const assessmentAttempts = pgTable("assessmentAttempts", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessmentId").notNull(),
  userId: integer("userId").notNull(),
  score: integer("score").notNull(),
  skillProfileJson: text("skillProfileJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: challengesTypePgEnum("type").default("basic").notNull(),
  difficulty: challengesDifficultyPgEnum("difficulty").default("beginner").notNull(),
  points: integer("points").default(100).notNull(),
  validationMode: challengesValidationModePgEnum("validationMode").default("STATIC_FLAG").notNull(),
  expectedHash: varchar("expectedHash", { length: 128 }),
  hintText: text("hintText"),
  skillId: integer("skillId"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const challengeSubmissions = pgTable("challengeSubmissions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challengeId").notNull(),
  userId: integer("userId").notNull(),
  answerHash: varchar("answerHash", { length: 128 }).notNull(),
  correct: boolean("correct").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userSkills = pgTable("userSkills", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  skillId: integer("skillId").notNull(),
  score: integer("score").default(0).notNull(),
  evidenceCount: integer("evidenceCount").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const skillEvidence = pgTable("skillEvidence", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  skillId: integer("skillId").notNull(),
  sourceType: varchar("sourceType", { length: 64 }).notNull(),
  sourceId: integer("sourceId"),
  result: skillEvidenceResultPgEnum("result").default("success").notNull(),
  difficulty: skillEvidenceDifficultyPgEnum("difficulty").default("beginner").notNull(),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const labTemplates = pgTable("labTemplates", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  image: varchar("image", { length: 512 }).notNull(),
  description: text("description").notNull(),
  cpuLimit: integer("cpuLimit").default(1).notNull(),
  memoryMb: integer("memoryMb").default(512).notNull(),
  diskMb: integer("diskMb").default(2048).notNull(),
  pidLimit: integer("pidLimit").default(128).notNull(),
  ttlSeconds: integer("ttlSeconds").default(3600).notNull(),
  exposedPortsJson: text("exposedPortsJson").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const labInstances = pgTable("labInstances", {
  id: serial("id").primaryKey(),
  instanceId: varchar("instanceId", { length: 64 }).notNull().unique(),
  templateId: integer("templateId").notNull(),
  userId: integer("userId").notNull(),
  challengeId: integer("challengeId"),
  status: labInstancesStatusPgEnum("status").default("REQUESTED").notNull(),
  targetUrl: text("targetUrl"),
  containerRef: varchar("containerRef", { length: 255 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const labFlags = pgTable("labFlags", {
  id: serial("id").primaryKey(),
  labInstanceId: integer("labInstanceId").notNull(),
  flagHash: varchar("flagHash", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const xpTransactions = pgTable("xpTransactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  amount: integer("amount").notNull(),
  sourceType: varchar("sourceType", { length: 64 }).notNull(),
  sourceId: integer("sourceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  }, (table) => ({ rewardSourceUnique: unique("xpTransactions_user_source_unique").on(table.userId, table.sourceType, table.sourceId) }));

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userAchievements = pgTable("userAchievements", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  achievementId: integer("achievementId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const streaks = pgTable("streaks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  currentDays: integer("currentDays").default(0).notNull(),
  bestDays: integer("bestDays").default(0).notNull(),
  lastActivityDate: varchar("lastActivityDate", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const ctfEvents = pgTable("ctfEvents", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const ctfChallenges = pgTable("ctfChallenges", {
  id: serial("id").primaryKey(),
  eventId: integer("eventId").notNull(),
  challengeId: integer("challengeId").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  orderIndex: integer("orderIndex").default(0).notNull(),
});

export const ctfSubmissions = pgTable("ctfSubmissions", {
  id: serial("id").primaryKey(),
  eventId: integer("eventId").notNull(),
  challengeId: integer("challengeId").notNull(),
  userId: integer("userId").notNull(),
  answerHash: varchar("answerHash", { length: 128 }).notNull(),
  correct: boolean("correct").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirementsJson: text("requirementsJson").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projectSubmissions = pgTable("projectSubmissions", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  userId: integer("userId").notNull(),
  repositoryUrl: text("repositoryUrl"),
  reportUrl: text("reportUrl"),
  status: projectSubmissionsStatusPgEnum("status").default("submitted").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  headline: varchar("headline", { length: 255 }),
  summary: text("summary"),
  public: boolean("public").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const portfolioItems = pgTable("portfolioItems", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolioId").notNull(),
  sourceType: varchar("sourceType", { length: 64 }).notNull(),
  sourceId: integer("sourceId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("orderIndex").default(0).notNull(),
});

export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actorUserId"),
  action: varchar("action", { length: 120 }).notNull(),
  resourceType: varchar("resourceType", { length: 120 }),
  resourceId: integer("resourceId"),
  metadataJson: text("metadataJson"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Roadmap = typeof roadmaps.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type CVE = typeof cves.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Book = typeof books.$inferSelect;
export type TrackQuiz = typeof trackQuizzes.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type TrackLevel = typeof trackLevels.$inferSelect;
export type MalwareFamily = typeof malwareFamilies.$inferSelect;

export type Challenge = typeof challenges.$inferSelect;
export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type UserSkill = typeof userSkills.$inferSelect;
export type SkillEvidence = typeof skillEvidence.$inferSelect;
export type LabTemplate = typeof labTemplates.$inferSelect;
export type LabInstance = typeof labInstances.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Portfolio = typeof portfolios.$inferSelect;

export type OnboardingProfile = typeof onboardingProfiles.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;
