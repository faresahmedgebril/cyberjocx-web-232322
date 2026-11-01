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