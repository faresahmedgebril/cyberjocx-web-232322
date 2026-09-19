CREATE TABLE `jobs` (
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
--> statement-breakpoint
CREATE INDEX `jobs_status_available_idx` ON `jobs` (`status`, `availableAt`);
