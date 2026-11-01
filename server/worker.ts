import "dotenv/config";
import { logger } from "./core/logger";
import { closeDatabase } from "./infrastructure/database/client";
import { runQueuedJobs } from "./nvdSync";
import { cleanupExpiredLabs } from "./modules/labs/service";

const JOB_POLL_INTERVAL_MS = 5_000;
const LAB_CLEANUP_INTERVAL_MS = 60_000;

export function startEmbeddedWorker() {
  let stopping = false;
  let timer: NodeJS.Timeout | undefined;
  let activeRun: Promise<void> | null = null;
  let lastCleanupAt = 0;

  const scheduleNext = () => {
    if (stopping) return;
    timer = setTimeout(() => {
      activeRun = (async () => {
        try {
          await runQueuedJobs();

          if (Date.now() - lastCleanupAt >= LAB_CLEANUP_INTERVAL_MS) {
            const cleaned = await cleanupExpiredLabs();
            lastCleanupAt = Date.now();
            if (cleaned > 0) logger.info("Expired labs cleaned", { cleaned });
          }
        } catch (error) {
          logger.error("Embedded worker job failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })().finally(() => {
        activeRun = null;
        scheduleNext();
      });
    }, JOB_POLL_INTERVAL_MS);
  };

  logger.info("Embedded background worker started", {
    pollIntervalMs: JOB_POLL_INTERVAL_MS,
    cleanupIntervalMs: LAB_CLEANUP_INTERVAL_MS,
  });
  scheduleNext();

  return async function stopEmbeddedWorker() {
    if (stopping) return;
    stopping = true;
    if (timer) clearTimeout(timer);
    if (activeRun) await activeRun;
    logger.info("Embedded background worker stopped");
  };
}

if (import.meta.url === "file://" + process.argv[1]) {
  const stop = startEmbeddedWorker();
  const shutdown = async (signal: string) => {
    logger.info("Worker stopping", { signal });
    await stop();
    await closeDatabase();
  };
  process.once("SIGTERM", () => { void shutdown("SIGTERM"); });
  process.once("SIGINT", () => { void shutdown("SIGINT"); });
}
