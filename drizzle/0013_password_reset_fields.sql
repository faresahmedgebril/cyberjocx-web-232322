ALTER TABLE `users`
  ADD COLUMN `passwordResetTokenHash` varchar(128) NULL,
  ADD COLUMN `passwordResetExpiresAt` timestamp NULL;
