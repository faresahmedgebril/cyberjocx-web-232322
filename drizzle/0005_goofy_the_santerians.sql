CREATE TABLE `friendRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `friendRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `malwareFamilies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`description` text NOT NULL,
	`targets` text NOT NULL,
	`mitreTechniques` text NOT NULL,
	`sourceUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `malwareFamilies_id` PRIMARY KEY(`id`),
	CONSTRAINT `malwareFamilies_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `trackLevelModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackLevelId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`actionItems` text NOT NULL,
	`videoUrl` text,
	`orderIndex` int NOT NULL,
	CONSTRAINT `trackLevelModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trackLevels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackId` int NOT NULL,
	`levelKey` enum('beginner','junior','mid','senior','professional') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`requirements` text NOT NULL,
	`certificateName` varchar(255) NOT NULL,
	`orderIndex` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trackLevels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userTrackLevels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trackId` int NOT NULL,
	`currentLevel` int NOT NULL DEFAULT 1,
	`completedLevelsJson` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userTrackLevels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `bannerUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `linkedinUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `memberRank` enum('learner','contributor','analyst','mentor','elite') DEFAULT 'learner' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `primaryTrackId` int;