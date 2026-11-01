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