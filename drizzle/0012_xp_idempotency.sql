ALTER TABLE `xpTransactions`
  ADD CONSTRAINT `xpTransactions_user_source_unique` UNIQUE (`userId`, `sourceType`, `sourceId`);
