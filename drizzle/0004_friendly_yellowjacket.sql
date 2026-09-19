CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trackId` int NOT NULL,
	`certificateCode` varchar(64) NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateCode_unique` UNIQUE(`certificateCode`)
);
--> statement-breakpoint
CREATE TABLE `nvdSyncRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`status` varchar(32) NOT NULL,
	`importedCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	CONSTRAINT `nvdSyncRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nvdSyncSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`lastStartedAt` timestamp,
	`lastCompletedAt` timestamp,
	`lastStatus` varchar(32) NOT NULL DEFAULT 'never',
	`lastImported` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nvdSyncSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL,
	`passed` boolean NOT NULL DEFAULT false,
	`answersJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`prompt` text NOT NULL,
	`optionsJson` text NOT NULL,
	`answerIndex` int NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	CONSTRAINT `quizQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trackQuizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`passingScore` int NOT NULL DEFAULT 70,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trackQuizzes_id` PRIMARY KEY(`id`)
);
