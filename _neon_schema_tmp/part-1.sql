CREATE TYPE "public"."challenges_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced');
--> statement-breakpoint
CREATE TYPE "public"."challenges_type_enum" AS ENUM('basic', 'static', 'ctf', 'lab');
--> statement-breakpoint
CREATE TYPE "public"."challenges_validationMode_enum" AS ENUM('STATIC_FLAG', 'SERVER_VALIDATOR', 'LAB_FLAG', 'AUTOMATED_TEST', 'PROJECT_CHECK');
--> statement-breakpoint
CREATE TYPE "public"."courses_level_enum" AS ENUM('beginner', 'intermediate', 'advanced');
--> statement-breakpoint
CREATE TYPE "public"."cves_severity_enum" AS ENUM('critical', 'high', 'medium', 'low');
--> statement-breakpoint
CREATE TYPE "public"."friendRequests_status_enum" AS ENUM('pending', 'accepted', 'declined');
--> statement-breakpoint
CREATE TYPE "public"."jobs_status_enum" AS ENUM('queued', 'running', 'completed', 'failed');
--> statement-breakpoint
CREATE TYPE "public"."labInstances_status_enum" AS ENUM('REQUESTED', 'PROVISIONING', 'READY', 'RUNNING', 'COMPLETED', 'EXPIRED', 'CLEANUP', 'DESTROYED', 'FAILED');
--> statement-breakpoint
CREATE TYPE "public"."malwareFamilies_severity_enum" AS ENUM('critical', 'high', 'medium', 'low');
--> statement-breakpoint
CREATE TYPE "public"."notifications_type_enum" AS ENUM('cve', 'content', 'system');
--> statement-breakpoint
CREATE TYPE "public"."projectSubmissions_status_enum" AS ENUM('submitted', 'reviewed', 'accepted', 'rejected');
--> statement-breakpoint
CREATE TYPE "public"."skillEvidence_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced');
--> statement-breakpoint
CREATE TYPE "public"."skillEvidence_result_enum" AS ENUM('success', 'partial', 'failed');
--> statement-breakpoint
CREATE TYPE "public"."trackLevels_levelKey_enum" AS ENUM('beginner', 'junior', 'mid', 'senior', 'professional');
--> statement-breakpoint
CREATE TYPE "public"."users_memberRank_enum" AS ENUM('learner', 'contributor', 'analyst', 'mentor', 'elite');
--> statement-breakpoint
CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin');
--> statement-breakpoint
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