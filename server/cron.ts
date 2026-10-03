import "dotenv/config";
import { syncRecentNvd } from "./nvdSync";
import { cleanupExpiredLabs } from "./modules/labs/service";
import { closeDatabase } from "./infrastructure/database/client";
import { logger } from "./core/logger";

async function main() {
  const startedAt = Date.now();
  logger.info("Cron job started", { job: "nvd-sync" });
  try {
    const nvd = await syncRecentNvd();
    const cleanedLabs = await cleanupExpiredLabs();
    logger.info("Cron job completed", {
      job: "nvd-sync",
      imported: nvd.imported,
      cleanedLabs,
      durationMs: Date.now() - startedAt,
    });
  } finally {
    await closeDatabase();
  }
}

main().catch(error => {
  logger.error("Cron job failed", {
    job: "nvd-sync",
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
