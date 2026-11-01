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