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