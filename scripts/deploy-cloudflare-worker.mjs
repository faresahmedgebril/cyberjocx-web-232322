import { readFile } from "node:fs/promises";

const ACCOUNT_ID = "91f0bdcf3f87b86358d38b5f7559dff1";
const WORKER_NAME = "cyberjocx-api";
const API_BASE_URL = "https://cyberjocx-api.gebrilfares972.workers.dev";
const GITHUB_PAGES_ORIGIN = "https://faresahmedgebril.github.io";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!TOKEN) {
  throw new Error("CLOUDFLARE_API_TOKEN is not configured; Worker release was not attempted.");
}

const apiRoot = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}`;
const authHeaders = { Authorization: `Bearer ${TOKEN}` };

async function cloudflareRequest(path, init = {}) {
  const response = await fetch(`${apiRoot}${path}`, {
    ...init,
    headers: {
      ...authHeaders,
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success !== true) {
    const details = Array.isArray(payload.errors)
      ? payload.errors.map(item => item.message).filter(Boolean).join("; ")
      : "Unknown Cloudflare API error";
    throw new Error(`Cloudflare API request failed (${response.status}): ${details}`);
  }

  return payload.result;
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Expected JSON from ${url}; received HTTP ${response.status}`);
  }
  return { response, body };
}

async function waitForProductionReady() {
  let lastError;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const { response, body } = await fetchJson(`${API_BASE_URL}/ready`);
      if (response.ok && body?.ok === true && body?.database === true) return;
      lastError = new Error(`Worker readiness check returned HTTP ${response.status}: ${textPreview(body)}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 3_000));
  }
  throw lastError ?? new Error("Worker readiness check failed");
}

function textPreview(value) {
  return JSON.stringify(value).slice(0, 500);
}

const bundle = await readFile(new URL("../dist/cloudflare-worker.js", import.meta.url));
if (bundle.byteLength < 100_000) {
  throw new Error(`Worker bundle is unexpectedly small (${bundle.byteLength} bytes); refusing production upload.`);
}

const inheritedBindingNames = [
  "API_BASE_URL",
  "APP_WEB_URL",
  "AUTH_RATE_LIMIT",
  "CORS_ORIGINS",
  "CRON_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "HYPERDRIVE",
  "NODE_ENV",
  "OWNER_OPEN_ID",
  "PORT",
  "PUBLIC_API_RATE_LIMIT",
];

const metadata = {
  main_module: "cloudflare-worker.js",
  compatibility_date: "2026-11-01",
  compatibility_flags: ["nodejs_compat"],
  bindings: inheritedBindingNames.map(name => ({
    name,
    type: "inherit",
    version_id: "latest",
  })),
  annotations: {
    "workers/message": "Fix request-scoped Hyperdrive clients and verify OAuth/database routes",
    ...(process.env.GITHUB_SHA ? { "workers/commit_sha": process.env.GITHUB_SHA } : {}),
    ...(process.env.GITHUB_REPOSITORY ? {
      "workers/repository_url": `https://github.com/${process.env.GITHUB_REPOSITORY}`,
    } : {}),
  },
};

const form = new FormData();
form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
form.append("files", new Blob([bundle], { type: "application/javascript+module" }), "cloudflare-worker.js");

console.log(`Uploading Worker module (${bundle.byteLength} bytes) with strict inherited bindings...`);
const version = await cloudflareRequest("/versions?bindings_inherit=strict", {
  method: "POST",
  body: form,
});
if (!version?.id) throw new Error("Cloudflare did not return a Worker version ID.");

const deployment = await cloudflareRequest("/deployments", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    strategy: "percentage",
    versions: [{ version_id: version.id, percentage: 100 }],
    annotations: {
      "workers/message": "Release request-scoped Hyperdrive database fix",
    },
  }),
});

const activeVersion = deployment?.versions?.find(item => item.percentage === 100)?.version_id;
if (activeVersion !== version.id) {
  throw new Error("Cloudflare deployment response did not confirm the new version at 100% traffic.");
}

console.log(`Deployed Worker version ${version.id} to 100% traffic. Verifying production...`);

const health = await fetchJson(`${API_BASE_URL}/health`);
if (!health.response.ok || health.body?.ok !== true) {
  throw new Error(`Worker health check failed: ${textPreview(health.body)}`);
}

await waitForProductionReady();

const leaderboardUrl = `${API_BASE_URL}/api/trpc/leaderboard.list?input=%7B%22json%22%3A%7B%22period%22%3A%22all-time%22%7D%7D`;
const leaderboard = await fetchJson(leaderboardUrl);
const leaderboardData = leaderboard.body?.result?.data?.json ?? leaderboard.body?.result?.data;
if (!leaderboard.response.ok || !leaderboardData || !Array.isArray(leaderboardData.entries)) {
  throw new Error(`Database-backed leaderboard check failed: ${textPreview(leaderboard.body)}`);
}
if (!Number.isFinite(Number(leaderboardData.totalMembers))) {
  throw new Error("Leaderboard returned an invalid totalMembers value.");
}
for (const entry of leaderboardData.entries) {
  if (!Number.isFinite(Number(entry.points))) throw new Error("Leaderboard returned an invalid points value.");
  for (const field of ["email", "passwordHash", "passwordResetTokenHash", "sessionToken"]) {
    if (Object.hasOwn(entry, field)) throw new Error(`Sensitive field leaked from leaderboard: ${field}`);
  }
}

for (const provider of ["github", "google"]) {
  const response = await fetch(`${API_BASE_URL}/api/auth/${provider}/login`, {
    redirect: "manual",
  });
  if (response.status !== 302) {
    throw new Error(`${provider} OAuth start returned HTTP ${response.status} instead of 302.`);
  }

  const location = response.headers.get("location");
  const stateCookie = response.headers.get("set-cookie") ?? "";
  if (!location || !stateCookie.includes(`__Host-cyberjocx_${provider}_oauth_state=`)) {
    throw new Error(`${provider} OAuth start did not set the expected redirect/state cookie.`);
  }
  if (!/HttpOnly/i.test(stateCookie) || !/Secure/i.test(stateCookie) || !/SameSite=Lax/i.test(stateCookie)) {
    throw new Error(`${provider} OAuth state cookie flags are incomplete.`);
  }

  const authorizationUrl = new URL(location);
  const expectedHost = provider === "github" ? "github.com" : "accounts.google.com";
  if (authorizationUrl.hostname !== expectedHost) {
    throw new Error(`${provider} OAuth redirected to an unexpected host.`);
  }
  const callback = authorizationUrl.searchParams.get("redirect_uri");
  const expectedCallback = `${API_BASE_URL}/api/auth/${provider}/callback`;
  if (callback !== expectedCallback) {
    throw new Error(`${provider} OAuth callback URI mismatch.`);
  }
}

const invalidState = await fetch(
  `${API_BASE_URL}/api/auth/github/callback?code=invalid&state=${"A".repeat(43)}`,
  { redirect: "manual" },
);
if (invalidState.status !== 302 ||
    !(invalidState.headers.get("location") ?? "").includes("authError=github-state")) {
  throw new Error("GitHub OAuth callback did not reject a missing state cookie.");
}

console.log("Production Worker checks passed:", JSON.stringify({
  version: version.id,
  health: true,
  neonReady: true,
  leaderboardEntries: leaderboardData.entries.length,
  githubOAuthStart: true,
  googleOAuthStart: true,
  githubInvalidStateRejected: true,
}));
