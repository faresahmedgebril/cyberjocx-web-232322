CREATE TABLE IF NOT EXISTS `onboardingProfiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `level` varchar(32) NOT NULL,
  `interestsJson` text NOT NULL,
  `goal` varchar(80) NOT NULL,
  `studyTime` varchar(32) NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `onboardingProfiles_id` PRIMARY KEY(`id`),
  CONSTRAINT `onboardingProfiles_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `assessments_id` PRIMARY KEY(`id`),
  CONSTRAINT `assessments_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `assessmentQuestions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assessmentId` int NOT NULL,
  `skillId` int NOT NULL,
  `prompt` text NOT NULL,
  `optionsJson` text NOT NULL,
  `answerIndex` int NOT NULL,
  `weight` int NOT NULL DEFAULT 10,
  `orderIndex` int NOT NULL DEFAULT 0,
  CONSTRAINT `assessmentQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `assessmentAttempts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assessmentId` int NOT NULL,
  `userId` int NOT NULL,
  `score` int NOT NULL,
  `skillProfileJson` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `assessmentAttempts_id` PRIMARY KEY(`id`)
);
