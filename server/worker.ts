import "dotenv/config";
import { logger } from "./core/logger";
import { closeDatabase } from "./infrastructure/database/client";
import { runQueuedJobs, syncRecentNvd } from "./nvdSync";

const JOB_POLL_INTERVAL_MS = 5_000;
const NVD_SYNC_INTERVAL_MS = 60 * 60 * 1_000;

let stopping = false;
let nvdSyncTimer: NodeJS.Timeout | undefined;
let activeNvdSync: Promise<void> | null = null;

function scheduleNvdSync() {
  if (stopping) return;

  nvdSyncTimer = setTimeout(() => {
    nvdSyncTimer = undefined;
    if (stopping) return;

    const startedAt = Date.now();
    activeNvdSync = (async () => {
      try {
        const result = await syncRecentNvd();
        logger.info("Scheduled NVD sync completed", {
          job: "nvd-sync",
          imported: result.imported,
          durationMs: Date.now() - startedAt,
        });
      } catch (error) {
        logger.error("Scheduled NVD sync failed", {
          job: "nvd-sync",
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - startedAt,
        });
      }
    })().finally(() => {
      activeNvdSync = null;
      scheduleNvdSync();
    });
  }, NVD_SYNC_INTERVAL_MS);

  logger.info("Scheduled NVD sync registered", {
    intervalMs: NVD_SYNC_INTERVAL_MS,
  });
}

async function main() {
  logger.info("Worker started");
  scheduleNvdSync();

  while (!stopping) {
    try {
      await runQueuedJobs();
    } catch (error) {
      logger.error("Worker job failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    if (!stopping) {
      await new Promise(resolve => setTimeout(resolve, JOB_POLL_INTERVAL_MS));
    }
  }

  if (nvdSyncTimer) clearTimeout(nvdSyncTimer);
  if (activeNvdSync) await activeNvdSync;
  await closeDatabase();
}

async function stop(signal: string) {
  if (stopping) return;
  stopping = true;
  if (nvdSyncTimer) clearTimeout(nvdSyncTimer);
  logger.info("Worker stopping", { signal });
}

process.once("SIGTERM", () => { void stop("SIGTERM"); });
process.once("SIGINT", () => { void stop("SIGINT"); });

main().catch(error => {
  logger.error("Worker failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
