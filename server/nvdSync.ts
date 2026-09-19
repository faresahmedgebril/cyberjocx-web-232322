import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { cves, getDb, nvdSyncRuns, nvdSyncSettings } from "./db";
import { ENV } from "./config/env";
import { NVD_BATCH_SIZE, NVD_LOOKBACK_HOURS } from "./config/constants";
import { queue } from "./infrastructure/queue/provider";

async function fetchWithRetry(url: URL, attempts = 4) {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json", ...(ENV.NVD_API_KEY ? { apiKey: ENV.NVD_API_KEY } : {}) }, signal: AbortSignal.timeout(30_000) });
      if (response.ok) return response;
      if (![408, 425, 429, 500, 502, 503, 504].includes(response.status)) throw new Error(`NVD returned ${response.status}`);
      await new Promise(resolve => setTimeout(resolve, Math.min(30_000, 500 * 2 ** attempt)));
    } catch (error) { lastError = error; if (attempt === attempts - 1) throw error; await new Promise(resolve => setTimeout(resolve, Math.min(30_000, 500 * 2 ** attempt))); }
  }
  throw lastError instanceof Error ? lastError : new Error("NVD request failed");
}

export async function syncRecentNvd() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const startedAt = new Date();
  const run = await db.insert(nvdSyncRuns).values({ status: "running", startedAt });
  const runId = Number(run[0]?.insertId ?? 0);
  await db.insert(nvdSyncSettings).values({ id: 1, lastStatus: "running", lastStartedAt: startedAt }).onDuplicateKeyUpdate({ set: { lastStatus: "running", lastStartedAt: startedAt } });
  try {
    const end = new Date();
    const start = new Date(end.getTime() - NVD_LOOKBACK_HOURS * 60 * 60 * 1000);
    const url = new URL(ENV.NVD_API_URL);
    url.searchParams.set("pubStartDate", start.toISOString());
    url.searchParams.set("pubEndDate", end.toISOString());
    url.searchParams.set("resultsPerPage", String(NVD_BATCH_SIZE));
    const response = await fetchWithRetry(url);
    const payload = await response.json() as {
      vulnerabilities?: Array<{
        cve?: {
          id?: string;
          descriptions?: Array<{ lang?: string; value?: string }>;
          published?: string;
          metrics?: Record<string, Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>>;
          configurations?: Array<{ nodes?: Array<{ cpeMatch?: Array<{ criteria?: string }> }> }>;
        };
      }>;
    };
    let imported = 0;
    for (const item of payload.vulnerabilities ?? []) {
      const cve = item.cve;
      if (!cve?.id || !cve.published) continue;
      const metric = cve.metrics?.cvssMetricV40?.[0] ?? cve.metrics?.cvssMetricV31?.[0] ?? cve.metrics?.cvssMetricV30?.[0];
      const rawSeverity = metric?.cvssData?.baseSeverity?.toLowerCase() ?? "medium";
      const severity = (["critical", "high", "medium", "low"].includes(rawSeverity) ? rawSeverity : "medium") as "critical" | "high" | "medium" | "low";
      const affected = cve.configurations?.flatMap(config => config.nodes?.flatMap(node => node.cpeMatch?.map(match => match.criteria).filter(Boolean) ?? []) ?? []).slice(0, 4).join(", ") || "See NVD configuration details";
      const description = cve.descriptions?.find(value => value.lang === "en")?.value ?? cve.descriptions?.[0]?.value ?? "No description provided by NVD.";
      await db.insert(cves).values({ cveNumber: cve.id, title: cve.id, description, severity, cvss: String(metric?.cvssData?.baseScore ?? 0), publishedDate: cve.published, affected, sourceUrl: `https://nvd.nist.gov/vuln/detail/${cve.id}` }).onDuplicateKeyUpdate({ set: { description, severity, cvss: String(metric?.cvssData?.baseScore ?? 0), publishedDate: cve.published, affected, sourceUrl: `https://nvd.nist.gov/vuln/detail/${cve.id}` } });
      imported += 1;
    }
    const completedAt = new Date();
    if (runId) await db.update(nvdSyncRuns).set({ status: "success", completedAt, importedCount: imported }).where(eq(nvdSyncRuns.id, runId));
    await db.update(nvdSyncSettings).set({ lastStatus: "success", lastCompletedAt: completedAt, lastImported: imported }).where(eq(nvdSyncSettings.id, 1));
    return { imported, completedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown NVD sync error";
    if (runId) await db.update(nvdSyncRuns).set({ status: "failed", completedAt: new Date(), errorMessage: message }).where(eq(nvdSyncRuns.id, runId));
    await db.update(nvdSyncSettings).set({ lastStatus: "failed" }).where(eq(nvdSyncSettings.id, 1));
    throw error;
  }
}

export async function handleNvdSync(req: Request, res: Response) {
  const supplied = req.headers["x-cron-secret"] ?? (typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined);
  if (!ENV.CRON_SECRET || supplied !== ENV.CRON_SECRET) return res.status(403).json({ error: "cron-only" });
  const db = await getDb();
  if (!db) return res.status(503).json({ error: "database-unavailable" });
  const job = await queue.enqueue("nvd-sync", { requestedAt: new Date().toISOString() });
  return res.status(202).json({ ok: true, queued: true, jobId: job.id });
}

export async function runQueuedJobs() {
  const job = await queue.claim("nvd-sync");
  if (!job) return false;
  try {
    await syncRecentNvd();
    await queue.complete(job.id);
    return true;
  } catch (error) {
    await queue.fail(job.id, error instanceof Error ? error.message : "NVD sync failed");
    throw error;
  }
}
