CREATE TYPE "public"."challenges_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."challenges_type_enum" AS ENUM('basic', 'static', 'ctf', 'lab');--> statement-breakpoint
CREATE TYPE "public"."challenges_validationMode_enum" AS ENUM('STATIC_FLAG', 'SERVER_VALIDATOR', 'LAB_FLAG', 'AUTOMATED_TEST', 'PROJECT_CHECK');--> statement-breakpoint
CREATE TYPE "public"."courses_level_enum" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."cves_severity_enum" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."friendRequests_status_enum" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."jobs_status_enum" AS ENUM('queued', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."labInstances_status_enum" AS ENUM('REQUESTED', 'PROVISIONING', 'READY', 'RUNNING', 'COMPLETED', 'EXPIRED', 'CLEANUP', 'DESTROYED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."malwareFamilies_severity_enum" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."notifications_type_enum" AS ENUM('cve', 'content', 'system');--> statement-breakpoint
CREATE TYPE "public"."projectSubmissions_status_enum" AS ENUM('submitted', 'reviewed', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."skillEvidence_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."skillEvidence_result_enum" AS ENUM('success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."trackLevels_levelKey_enum" AS ENUM('beginner', 'junior', 'mid', 'senior', 'professional');--> statement-breakpoint
CREATE TYPE "public"."users_memberRank_enum" AS ENUM('learner', 'contributor', 'analyst', 'mentor', 'elite');--> statement-breakpoint
CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "assessmentAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessmentId" integer NOT NULL,
	"userId" integer NOT NULL,
	"score" integer NOT NULL,
	"skillProfileJson" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessmentQuestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessmentId" integer NOT NULL,
	"skillId" integer NOT NULL,
	"prompt" text NOT NULL,
	"optionsJson" text NOT NULL,
	"answerIndex" integer NOT NULL,
	"weight" integer DEFAULT 10 NOT NULL,
	"orderIndex" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assessments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actorUserId" integer,
	"action" varchar(120) NOT NULL,
	"resourceType" varchar(120),
	"resourceId" integer,
	"metadataJson" text,
	"ipAddress" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"pricePoints" integer DEFAULT 100 NOT NULL,
	"coverUrl" text,
	"downloadUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cartItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"cartId" integer NOT NULL,
	"bookId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carts_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"trackId" integer NOT NULL,
	"trackLevelId" integer,
	"certificateCode" varchar(64) NOT NULL,
	"issuedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_certificateCode_unique" UNIQUE("certificateCode")
);
--> statement-breakpoint
CREATE TABLE "challengeSubmissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"answerHash" varchar(128) NOT NULL,
	"correct" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" "challenges_type_enum" DEFAULT 'basic' NOT NULL,
	"difficulty" "challenges_difficulty_enum" DEFAULT 'beginner' NOT NULL,
	"points" integer DEFAULT 100 NOT NULL,
	"validationMode" "challenges_validationMode_enum" DEFAULT 'STATIC_FLAG' NOT NULL,
	"expectedHash" varchar(128),
	"hintText" text,
	"skillId" integer,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "courseProgress" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"level" "courses_level_enum" DEFAULT 'beginner' NOT NULL,
	"instructor" varchar(255) NOT NULL,
	"lessons" integer DEFAULT 8 NOT NULL,
	"durationMinutes" integer DEFAULT 240 NOT NULL,
	"requiredPoints" integer DEFAULT 0 NOT NULL,
	"coverUrl" text,
	"courseUrl" text,
	"isPublished" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ctfChallenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"category" varchar(80) NOT NULL,
	"orderIndex" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctfEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"startsAt" timestamp,
	"endsAt" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ctfEvents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ctfSubmissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"answerHash" varchar(128) NOT NULL,
	"correct" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cves" (
	"id" serial PRIMARY KEY NOT NULL,
	"cveNumber" varchar(32) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"severity" "cves_severity_enum" NOT NULL,
	"cvss" varchar(8) NOT NULL,
	"publishedDate" varchar(32) NOT NULL,
	"affected" varchar(255) NOT NULL,
	"sourceUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cves_cveNumber_unique" UNIQUE("cveNumber")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"followerId" integer NOT NULL,
	"followingId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"senderId" integer NOT NULL,
	"recipientId" integer NOT NULL,
	"status" "friendRequests_status_enum" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"jobId" varchar(64) NOT NULL,
	"name" varchar(64) NOT NULL,
	"payloadJson" text NOT NULL,
	"status" "jobs_status_enum" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"availableAt" timestamp DEFAULT now() NOT NULL,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_jobId_unique" UNIQUE("jobId")
);
--> statement-breakpoint
CREATE TABLE "labFlags" (
	"id" serial PRIMARY KEY NOT NULL,
	"labInstanceId" integer NOT NULL,
	"flagHash" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labInstances" (
	"id" serial PRIMARY KEY NOT NULL,
	"instanceId" varchar(64) NOT NULL,
	"templateId" integer NOT NULL,
	"userId" integer NOT NULL,
	"challengeId" integer,
	"status" "labInstances_status_enum" DEFAULT 'REQUESTED' NOT NULL,
	"targetUrl" text,
	"containerRef" varchar(255),
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "labInstances_instanceId_unique" UNIQUE("instanceId")
);
--> statement-breakpoint
CREATE TABLE "labTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(512) NOT NULL,
	"description" text NOT NULL,
	"cpuLimit" integer DEFAULT 1 NOT NULL,
	"memoryMb" integer DEFAULT 512 NOT NULL,
	"diskMb" integer DEFAULT 2048 NOT NULL,
	"pidLimit" integer DEFAULT 128 NOT NULL,
	"ttlSeconds" integer DEFAULT 3600 NOT NULL,
	"exposedPortsJson" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "labTemplates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "malwareFamilies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"severity" "malwareFamilies_severity_enum" NOT NULL,
	"description" text NOT NULL,
	"targets" text NOT NULL,
	"mitreTechniques" text NOT NULL,
	"sourceUrl" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "malwareFamilies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"type" "notifications_type_enum" DEFAULT 'system' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nvdSyncRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"status" varchar(32) NOT NULL,
	"importedCount" integer DEFAULT 0 NOT NULL,
	"errorMessage" text
);
--> statement-breakpoint
CREATE TABLE "nvdSyncSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"scheduleCronTaskUid" varchar(65),
	"lastStartedAt" timestamp,
	"lastCompletedAt" timestamp,
	"lastStatus" varchar(32) DEFAULT 'never' NOT NULL,
	"lastImported" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboardingProfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"level" varchar(32) NOT NULL,
	"interestsJson" text NOT NULL,
	"goal" varchar(80) NOT NULL,
	"studyTime" varchar(32) NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "onboardingProfiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "portfolioItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolioId" integer NOT NULL,
	"sourceType" varchar(64) NOT NULL,
	"sourceId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"orderIndex" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	"headline" varchar(255),
	"summary" text,
	"public" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "portfolios_userId_unique" UNIQUE("userId"),
	CONSTRAINT "portfolios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "postLikes" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"imageUrl" text,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projectSubmissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"userId" integer NOT NULL,
	"repositoryUrl" text,
	"reportUrl" text,
	"status" "projectSubmissions_status_enum" DEFAULT 'submitted' NOT NULL,
	"score" integer,
	"feedback" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"requirementsJson" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quizAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"quizId" integer NOT NULL,
	"userId" integer NOT NULL,
	"score" integer NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"answersJson" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizQuestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quizId" integer NOT NULL,
	"prompt" text NOT NULL,
	"optionsJson" text NOT NULL,
	"answerIndex" integer NOT NULL,
	"orderIndex" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmapCourses" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadmapId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"orderIndex" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"focus" varchar(120) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tokenHash" varchar(128) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp,
	"userAgent" varchar(512),
	"ipAddress" varchar(64),
	CONSTRAINT "sessions_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "skillEvidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"skillId" integer NOT NULL,
	"sourceType" varchar(64) NOT NULL,
	"sourceId" integer,
	"result" "skillEvidence_result_enum" DEFAULT 'success' NOT NULL,
	"difficulty" "skillEvidence_difficulty_enum" DEFAULT 'beginner' NOT NULL,
	"metadataJson" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(120) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"currentDays" integer DEFAULT 0 NOT NULL,
	"bestDays" integer DEFAULT 0 NOT NULL,
	"lastActivityDate" varchar(10),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "streaks_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"commands" text,
	"downloadUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trackCourses" (
	"id" serial PRIMARY KEY NOT NULL,
	"trackId" integer NOT NULL,
	"courseId" integer NOT NULL,
	"orderIndex" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trackLevelModules" (
	"id" serial PRIMARY KEY NOT NULL,
	"trackLevelId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"actionItems" text NOT NULL,
	"videoUrl" text,
	"orderIndex" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trackLevels" (
	"id" serial PRIMARY KEY NOT NULL,
	"trackId" integer NOT NULL,
	"levelKey" "trackLevels_levelKey_enum" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"requirements" text NOT NULL,
	"certificateName" varchar(255) NOT NULL,
	"orderIndex" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trackQuizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"trackId" integer NOT NULL,
	"trackLevelId" integer,
	"title" varchar(255) NOT NULL,
	"passingScore" integer DEFAULT 70 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trackTools" (
	"id" serial PRIMARY KEY NOT NULL,
	"trackId" integer NOT NULL,
	"toolId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"outcome" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tracks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "userAchievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"achievementId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userSkills" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"skillId" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"evidenceCount" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userTrackLevels" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"trackId" integer NOT NULL,
	"currentLevel" integer DEFAULT 1 NOT NULL,
	"completedLevelsJson" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"passwordHash" varchar(255),
	"passwordResetTokenHash" varchar(128),
	"passwordResetExpiresAt" timestamp,
	"role" "users_role_enum" DEFAULT 'user' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"isVip" boolean DEFAULT false NOT NULL,
	"bio" text,
	"avatarUrl" text,
	"bannerUrl" text,
	"phone" varchar(32),
	"linkedinUrl" text,
	"memberRank" "users_memberRank_enum" DEFAULT 'learner' NOT NULL,
	"primaryTrackId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "xpTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"amount" integer NOT NULL,
	"sourceType" varchar(64) NOT NULL,
	"sourceId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "xpTransactions_user_source_unique" UNIQUE("userId","sourceType","sourceId")
);
