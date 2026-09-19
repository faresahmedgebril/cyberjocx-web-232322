CREATE TABLE `roadmapCourses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roadmapId` int NOT NULL,
	`courseId` int NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	CONSTRAINT `roadmapCourses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roadmaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`focus` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roadmaps_id` PRIMARY KEY(`id`)
);
