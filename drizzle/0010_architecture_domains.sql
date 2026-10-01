CREATE TABLE IF NOT EXISTS `challenges` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `type` enum('basic','static','ctf','lab') NOT NULL DEFAULT 'basic',
  `difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  `points` int NOT NULL DEFAULT 100,
  `validationMode` enum('STATIC_FLAG','SERVER_VALIDATOR','LAB_FLAG','AUTOMATED_TEST','PROJECT_CHECK') NOT NULL DEFAULT 'STATIC_FLAG',
  `expectedHash` varchar(128),
  `hintText` text,
  `skillId` int,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `challenges_id` PRIMARY KEY(`id`),
  CONSTRAINT `challenges_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `challengeSubmissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `challengeId` int NOT NULL,
  `userId` int NOT NULL,
  `answerHash` varchar(128) NOT NULL,
  `correct` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `challengeSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `skills` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(120) NOT NULL,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `skills_id` PRIMARY KEY(`id`),
  CONSTRAINT `skills_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `userSkills` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `skillId` int NOT NULL,
  `score` int NOT NULL DEFAULT 0,
  `evidenceCount` int NOT NULL DEFAULT 0,
  `updatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `userSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `skillEvidence` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `skillId` int NOT NULL,
  `sourceType` varchar(64) NOT NULL,
  `sourceId` int,
  `result` enum('success','partial','failed') NOT NULL DEFAULT 'success',
  `difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  `metadataJson` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `skillEvidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `labTemplates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `image` varchar(512) NOT NULL,
  `description` text NOT NULL,
  `cpuLimit` int NOT NULL DEFAULT 1,
  `memoryMb` int NOT NULL DEFAULT 512,
  `diskMb` int NOT NULL DEFAULT 2048,
  `pidLimit` int NOT NULL DEFAULT 128,
  `ttlSeconds` int NOT NULL DEFAULT 3600,
  `exposedPortsJson` text NOT NULL,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `labTemplates_id` PRIMARY KEY(`id`),
  CONSTRAINT `labTemplates_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `labInstances` (
  `id` int AUTO_INCREMENT NOT NULL,
  `instanceId` varchar(64) NOT NULL,
  `templateId` int NOT NULL,
  `userId` int NOT NULL,
  `challengeId` int,
  `status` enum('REQUESTED','PROVISIONING','READY','RUNNING','COMPLETED','EXPIRED','CLEANUP','DESTROYED','FAILED') NOT NULL DEFAULT 'REQUESTED',
  `targetUrl` text,
  `containerRef` varchar(255),
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `labInstances_id` PRIMARY KEY(`id`),
  CONSTRAINT `labInstances_instanceId_unique` UNIQUE(`instanceId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `labFlags` (
  `id` int AUTO_INCREMENT NOT NULL,
  `labInstanceId` int NOT NULL,
  `flagHash` varchar(128) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `labFlags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `xpTransactions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `amount` int NOT NULL,
  `sourceType` varchar(64) NOT NULL,
  `sourceId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `xpTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
  CONSTRAINT `achievements_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `userAchievements` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `achievementId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `userAchievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `streaks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `currentDays` int NOT NULL DEFAULT 0,
  `bestDays` int NOT NULL DEFAULT 0,
  `lastActivityDate` varchar(10),
  `updatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `streaks_id` PRIMARY KEY(`id`),
  CONSTRAINT `streaks_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ctfEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `startsAt` timestamp NULL,
  `endsAt` timestamp NULL,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ctfEvents_id` PRIMARY KEY(`id`),
  CONSTRAINT `ctfEvents_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ctfChallenges` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventId` int NOT NULL,
  `challengeId` int NOT NULL,
  `category` varchar(80) NOT NULL,
  `orderIndex` int NOT NULL DEFAULT 0,
  CONSTRAINT `ctfChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ctfSubmissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventId` int NOT NULL,
  `challengeId` int NOT NULL,
  `userId` int NOT NULL,
  `answerHash` varchar(128) NOT NULL,
  `correct` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ctfSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `requirementsJson` text NOT NULL,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `projects_id` PRIMARY KEY(`id`),
  CONSTRAINT `projects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `projectSubmissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `userId` int NOT NULL,
  `repositoryUrl` text,
  `reportUrl` text,
  `status` enum('submitted','reviewed','accepted','rejected') NOT NULL DEFAULT 'submitted',
  `score` int,
  `feedback` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `projectSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `portfolios` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `slug` varchar(255) NOT NULL,
  `headline` varchar(255),
  `summary` text,
  `public` boolean NOT NULL DEFAULT true,
  `updatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `portfolios_id` PRIMARY KEY(`id`),
  CONSTRAINT `portfolios_user_unique` UNIQUE(`userId`),
  CONSTRAINT `portfolios_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `portfolioItems` (
  `id` int AUTO_INCREMENT NOT NULL,
  `portfolioId` int NOT NULL,
  `sourceType` varchar(64) NOT NULL,
  `sourceId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `orderIndex` int NOT NULL DEFAULT 0,
  CONSTRAINT `portfolioItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `auditLogs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `actorUserId` int,
  `action` varchar(120) NOT NULL,
  `resourceType` varchar(120),
  `resourceId` int,
  `metadataJson` text,
  `ipAddress` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `tokenHash` varchar(128) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `revokedAt` timestamp NULL,
  `userAgent` varchar(512),
  `ipAddress` varchar(64),
  CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
  CONSTRAINT `sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `jobId` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `payloadJson` text NOT NULL,
  `status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  `attempts` int NOT NULL DEFAULT 0,
  `availableAt` timestamp NOT NULL DEFAULT (now()),
  `startedAt` timestamp NULL,
  `completedAt` timestamp NULL,
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `jobs_id` PRIMARY KEY(`id`),
  CONSTRAINT `jobs_jobId_unique` UNIQUE(`jobId`)
);
