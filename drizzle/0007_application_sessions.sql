CREATE TABLE `sessions` (
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
CREATE INDEX `sessions_user_idx` ON `sessions` (`userId`);
--> statement-breakpoint
CREATE INDEX `sessions_expiry_idx` ON `sessions` (`expiresAt`);
--> statement-breakpoint
CREATE INDEX `courseProgress_user_course_idx` ON `courseProgress` (`userId`, `courseId`);
--> statement-breakpoint
CREATE INDEX `quizAttempts_user_quiz_idx` ON `quizAttempts` (`userId`, `quizId`);
--> statement-breakpoint
CREATE INDEX `postLikes_post_user_idx` ON `postLikes` (`postId`, `userId`);
--> statement-breakpoint
CREATE INDEX `follows_follower_following_idx` ON `follows` (`followerId`, `followingId`);
--> statement-breakpoint
CREATE INDEX `friendRequests_recipient_status_idx` ON `friendRequests` (`recipientId`, `status`);
--> statement-breakpoint
CREATE INDEX `cartItems_cart_book_idx` ON `cartItems` (`cartId`, `bookId`);
--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`userId`, `isRead`, `createdAt`);
