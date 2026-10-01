import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  points: int("points").default(640).notNull(),
  isVip: boolean("isVip").default(false).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  bannerUrl: text("bannerUrl"),
  phone: varchar("phone", { length: 32 }),
  linkedinUrl: text("linkedinUrl"),
  memberRank: mysqlEnum("memberRank", ["learner", "contributor", "analyst", "mentor", "elite"]).default("learner").notNull(),
  primaryTrackId: int("primaryTrackId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  userAgent: varchar("userAgent", { length: 512 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
});

export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  instructor: varchar("instructor", { length: 255 }).notNull(),
  lessons: int("lessons").default(8).notNull(),
  durationMinutes: int("durationMinutes").default(240).notNull(),
  requiredPoints: int("requiredPoints").default(0).notNull(),
  coverUrl: text("coverUrl"),
  courseUrl: text("courseUrl"),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const roadmaps = mysqlTable("roadmaps", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  focus: varchar("focus", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const roadmapCourses = mysqlTable("roadmapCourses", {
  id: int("id").autoincrement().primaryKey(),
  roadmapId: int("roadmapId").notNull(),
  courseId: int("courseId").notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
});

export const courseProgress = mysqlTable("courseProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  progress: int("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const cves = mysqlTable("cves", {
  id: int("id").autoincrement().primaryKey(),
  cveNumber: varchar("cveNumber", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  cvss: varchar("cvss", { length: 8 }).notNull(),
  publishedDate: varchar("publishedDate", { length: 32 }).notNull(),
  affected: varchar("affected", { length: 255 }).notNull(),
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tools = mysqlTable("tools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  commands: text("commands"),
  downloadUrl: text("downloadUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tracks = mysqlTable("tracks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  outcome: text("outcome").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trackCourses = mysqlTable("trackCourses", {
  id: int("id").autoincrement().primaryKey(),
  trackId: int("trackId").notNull(),
  courseId: int("courseId").notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
});

export const trackTools = mysqlTable("trackTools", {
  id: int("id").autoincrement().primaryKey(),
  trackId: int("trackId").notNull(),
  toolId: int("toolId").notNull(),
});

export const trackLevels = mysqlTable("trackLevels", {
  id: int("id").autoincrement().primaryKey(),
  trackId: int("trackId").notNull(),
  levelKey: mysqlEnum("levelKey", ["beginner", "junior", "mid", "senior", "professional"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  certificateName: varchar("certificateName", { length: 255 }).notNull(),
  orderIndex: int("orderIndex").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trackLevelModules = mysqlTable("trackLevelModules", {
  id: int("id").autoincrement().primaryKey(),
  trackLevelId: int("trackLevelId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  actionItems: text("actionItems").notNull(),
  videoUrl: text("videoUrl"),
  orderIndex: int("orderIndex").notNull(),
});

export const userTrackLevels = mysqlTable("userTrackLevels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trackId: int("trackId").notNull(),
  currentLevel: int("currentLevel").default(1).notNull(),
  completedLevelsJson: text("completedLevelsJson").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  likesCount: int("likesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postLikes = mysqlTable("postLikes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const friendRequests = mysqlTable("friendRequests", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const malwareFamilies = mysqlTable("malwareFamilies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  description: text("description").notNull(),
  targets: text("targets").notNull(),
  mitreTechniques: text("mitreTechniques").notNull(),
  sourceUrl: text("sourceUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  pricePoints: int("pricePoints").default(100).notNull(),
  coverUrl: text("coverUrl"),
  downloadUrl: text("downloadUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  cartId: int("cartId").notNull(),
  bookId: int("bookId").notNull(),
  quantity: int("quantity").default(1).notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  type: mysqlEnum("type", ["cve", "content", "system"]).default("system").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trackQuizzes = mysqlTable("trackQuizzes", {
  id: int("id").autoincrement().primaryKey(),
  trackId: int("trackId").notNull(),
  trackLevelId: int("trackLevelId"),
  title: varchar("title", { length: 255 }).notNull(),
  passingScore: int("passingScore").default(70).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  prompt: text("prompt").notNull(),
  optionsJson: text("optionsJson").notNull(),
  answerIndex: int("answerIndex").notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
});

export const quizAttempts = mysqlTable("quizAttempts", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  userId: int("userId").notNull(),
  score: int("score").notNull(),
  passed: boolean("passed").default(false).notNull(),
  answersJson: text("answersJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trackId: int("trackId").notNull(),
  trackLevelId: int("trackLevelId"),
  certificateCode: varchar("certificateCode", { length: 64 }).notNull().unique(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
});

export const nvdSyncSettings = mysqlTable("nvdSyncSettings", {
  id: int("id").autoincrement().primaryKey(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastStartedAt: timestamp("lastStartedAt"),
  lastCompletedAt: timestamp("lastCompletedAt"),
  lastStatus: varchar("lastStatus", { length: 32 }).default("never").notNull(),
  lastImported: int("lastImported").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const nvdSyncRuns = mysqlTable("nvdSyncRuns", {
  id: int("id").autoincrement().primaryKey(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  status: varchar("status", { length: 32 }).notNull(),
  importedCount: int("importedCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
});

export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  payloadJson: text("payloadJson").notNull(),
  status: mysqlEnum("status", ["queued", "running", "completed", "failed"]).default("queued").notNull(),
  attempts: int("attempts").default(0).notNull(),
  availableAt: timestamp("availableAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["basic", "static", "ctf", "lab"]).default("basic").notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  points: int("points").default(100).notNull(),
  validationMode: mysqlEnum("validationMode", ["STATIC_FLAG", "SERVER_VALIDATOR", "LAB_FLAG", "AUTOMATED_TEST", "PROJECT_CHECK"]).default("STATIC_FLAG").notNull(),
  expectedHash: varchar("expectedHash", { length: 128 }),
  hintText: text("hintText"),
  skillId: int("skillId"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const challengeSubmissions = mysqlTable("challengeSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  answerHash: varchar("answerHash", { length: 128 }).notNull(),
  correct: boolean("correct").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userSkills = mysqlTable("userSkills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillId: int("skillId").notNull(),
  score: int("score").default(0).notNull(),
  evidenceCount: int("evidenceCount").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const skillEvidence = mysqlTable("skillEvidence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillId: int("skillId").notNull(),
  sourceType: varchar("sourceType", { length: 64 }).notNull(),
  sourceId: int("sourceId"),
  result: mysqlEnum("result", ["success", "partial", "failed"]).default("success").notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const labTemplates = mysqlTable("labTemplates", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  image: varchar("image", { length: 512 }).notNull(),
  description: text("description").notNull(),
  cpuLimit: int("cpuLimit").default(1).notNull(),
  memoryMb: int("memoryMb").default(512).notNull(),
  diskMb: int("diskMb").default(2048).notNull(),
  pidLimit: int("pidLimit").default(128).notNull(),
  ttlSeconds: int("ttlSeconds").default(3600).notNull(),
  exposedPortsJson: text("exposedPortsJson").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const labInstances = mysqlTable("labInstances", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: varchar("instanceId", { length: 64 }).notNull().unique(),
  templateId: int("templateId").notNull(),
  userId: int("userId").notNull(),
  challengeId: int("challengeId"),
  status: mysqlEnum("status", ["REQUESTED", "PROVISIONING", "READY", "RUNNING", "COMPLETED", "EXPIRED", "CLEANUP", "DESTROYED", "FAILED"]).default("REQUESTED").notNull(),
  targetUrl: text("targetUrl"),
  containerRef: varchar("containerRef", { length: 255 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const labFlags = mysqlTable("labFlags", {
  id: int("id").autoincrement().primaryKey(),
  labInstanceId: int("labInstanceId").notNull(),
  flagHash: varchar("flagHash", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const xpTransactions = mysqlTable("xpTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  sourceType: varchar("sourceType", { length: 64 }).notNull(),
  sourceId: int("sourceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const streaks = mysqlTable("streaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentDays: int("currentDays").default(0).notNull(),
  bestDays: int("bestDays").default(0).notNull(),
  lastActivityDate: varchar("lastActivityDate", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const ctfEvents = mysqlTable("ctfEvents", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const ctfChallenges = mysqlTable("ctfChallenges", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  challengeId: int("challengeId").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
});

export const ctfSubmissions = mysqlTable("ctfSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  answerHash: varchar("answerHash", { length: 128 }).notNull(),
  correct: boolean("correct").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirementsJson: text("requirementsJson").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projectSubmissions = mysqlTable("projectSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  repositoryUrl: text("repositoryUrl"),
  reportUrl: text("reportUrl"),
  status: mysqlEnum("status", ["submitted", "reviewed", "accepted", "rejected"]).default("submitted").notNull(),
  score: int("score"),
  feedback: text("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  headline: varchar("headline", { length: 255 }),
  summary: text("summary"),
  public: boolean("public").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const portfolioItems = mysqlTable("portfolioItems", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  sourceType: varchar("sourceType", { length: 64 }).notNull(),
  sourceId: int("sourceId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: int("orderIndex").default(0).notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId"),
  action: varchar("action", { length: 120 }).notNull(),
  resourceType: varchar("resourceType", { length: 120 }),
  resourceId: int("resourceId"),
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
