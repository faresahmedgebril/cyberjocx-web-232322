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