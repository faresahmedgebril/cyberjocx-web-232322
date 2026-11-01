interface WorkerEnv {
  HYPERDRIVE: { connectionString: string };
  APP_WEB_URL: string;
  API_BASE_URL: string;
  CORS_ORIGINS: string;
  AUTH_RATE_LIMIT?: string;
  PUBLIC_API_RATE_LIMIT?: string;
  CRON_SECRET?: string;
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_OAUTH_REDIRECT_URI?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_OAUTH_REDIRECT_URI?: string;
}

const APP_BASE_PATH = "/cyberjocx-web-232322/";
const APP_BASE_NO_SLASH = APP_BASE_PATH.slice(0, -1);
let appInitialization: Promise<void> | null = null;

async function ensureApiInitialized(bindings: WorkerEnv): Promise<void> {
  if (!appInitialization) {
    appInitialization = (async () => {
      // Runtime bindings are read only inside a request handler. Importing ENV
      // before these assignments would validate empty values at module startup.
      Object.assign(process.env, {
        NODE_ENV: "production",
        SERVICE_ROLE: "api",
        PORT: "3000",
        DB_POOL_MAX: "2",
        DATABASE_URL: bindings.HYPERDRIVE.connectionString,
        APP_WEB_URL: bindings.APP_WEB_URL,
        API_BASE_URL: bindings.API_BASE_URL,
        CORS_ORIGINS: bindings.CORS_ORIGINS,
        SESSION_COOKIE_SECURE: "true",
        SESSION_COOKIE_SAMESITE: "lax",
        TRUST_PROXY: "true",
        AUTH_RATE_LIMIT: bindings.AUTH_RATE_LIMIT || "20",
        PUBLIC_API_RATE_LIMIT: bindings.PUBLIC_API_RATE_LIMIT || "300",
      });

      const optionalEnvironment: Record<string, string | undefined> = {
        CRON_SECRET: bindings.CRON_SECRET,
        RESEND_API_KEY: bindings.RESEND_API_KEY,
        AUTH_EMAIL_FROM: bindings.AUTH_EMAIL_FROM,
        GOOGLE_CLIENT_ID: bindings.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: bindings.GOOGLE_CLIENT_SECRET,
        GOOGLE_OAUTH_REDIRECT_URI: bindings.GOOGLE_OAUTH_REDIRECT_URI,
        GITHUB_CLIENT_ID: bindings.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: bindings.GITHUB_CLIENT_SECRET,
        GITHUB_OAUTH_REDIRECT_URI: bindings.GITHUB_OAUTH_REDIRECT_URI,
      };
      for (const [key, value] of Object.entries(optionalEnvironment)) {
        if (value) process.env[key] = value;
      }

      const { createApp } = await import("../server/_core/app");
      createApp().listen(3000);
    })();
  }
  await appInitialization;
}

function isApiRequest(pathname: string): boolean {
  return pathname === "/health" ||
    pathname === "/ready" ||
    pathname === "/api" ||
    pathname.startsWith("/api/");
}

export default {
  async fetch(request: Request, bindings: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.redirect(new URL(APP_BASE_PATH, request.url), 308);
    }

    if (isApiRequest(url.pathname)) {
      await ensureApiInitialized(bindings);
      const headers = new Headers(request.headers);
      headers.set("x-forwarded-proto", "https");
      headers.set("x-forwarded-host", url.host);
      const clientIp = request.headers.get("cf-connecting-ip");
      if (clientIp) headers.set("x-forwarded-for", clientIp);
      const apiRequest = new Request(request, { headers });
      const { handleAsNodeRequest } = await import("cloudflare:node");
      return handleAsNodeRequest(3000, apiRequest);
    }

    if (url.pathname === APP_BASE_NO_SLASH) {
      return Response.redirect(new URL(APP_BASE_PATH + url.search, request.url), 308);
    }

    if (!url.pathname.startsWith(APP_BASE_PATH)) {
      const correctedPath = APP_BASE_PATH + url.pathname.replace(/^\/+/, "");
      return Response.redirect(new URL(correctedPath + url.search, request.url), 308);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Route client-side SPA paths to index.html while keeping asset paths intact.
    const looksLikeFile = /\.[a-z0-9]{2,10}$/i.test(url.pathname);
    const upstreamPath = looksLikeFile ? url.pathname : APP_BASE_PATH + "index.html";
    const upstreamUrl = "https://faresahmedgebril.github.io" + upstreamPath + url.search;

    // Never forward the app's session cookie or auth headers to GitHub Pages.
    const upstreamHeaders = new Headers(request.headers);
    for (const header of [
      "cookie", "authorization", "origin", "referer", "host",
      "cf-connecting-ip", "cf-ray", "cf-visitor", "x-forwarded-for",
      "x-forwarded-host", "x-forwarded-proto",
    ]) upstreamHeaders.delete(header);

    const upstreamResponse = await fetch(new Request(upstreamUrl, {
      method: request.method,
      headers: upstreamHeaders,
      redirect: "manual",
    }));

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("x-content-type-options", "nosniff");
    responseHeaders.set("referrer-policy", "strict-origin-when-cross-origin");
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
