CREATE TABLE `trackCourses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackId` int NOT NULL,
	`courseId` int NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	CONSTRAINT `trackCourses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trackTools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackId` int NOT NULL,
	`toolId` int NOT NULL,
	CONSTRAINT `trackTools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`outcome` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tracks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tracks_slug_unique` UNIQUE(`slug`)
);
