import "dotenv/config";
import { logger } from "./core/logger";
import { closeDatabase } from "./infrastructure/database/client";
import { runQueuedJobs } from "./nvdSync";

let stopping = false;
async function main() {
  logger.info("Worker started");
  while (!stopping) {
    try { await runQueuedJobs(); }
    catch (error) { logger.error("Worker job failed", { error: error instanceof Error ? error.message : String(error) }); }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  await closeDatabase();
}
async function stop(signal: string) {
  stopping = true;
  logger.info("Worker stopping", { signal });
}
process.once("SIGTERM", () => { void stop("SIGTERM"); });
process.once("SIGINT", () => { void stop("SIGINT"); });
main().catch(error => { logger.error("Worker failed", { error: error instanceof Error ? error.message : String(error) }); process.exit(1); });
