import { env } from "cloudflare:workers";
import { handleAsNodeRequest } from "cloudflare:node";

const APP_BASE_PATH = "/cyberjocx-web-232322/";
const API_ORIGIN = "https://cyberjocx-api.gebrilfares972.workers.dev";

// Load runtime bindings into process.env before importing modules that validate
// server configuration at module initialization. Business logic stays portable.
Object.assign(process.env, {
  NODE_ENV: "production",
  SERVICE_ROLE: "api",
  PORT: "3000",
  DATABASE_URL: env.HYPERDRIVE.connectionString,
  APP_WEB_URL: env.APP_WEB_URL,
  API_BASE_URL: env.API_BASE_URL,
  CORS_ORIGINS: env.CORS_ORIGINS,
  SESSION_COOKIE_SECURE: "true",
  SESSION_COOKIE_SAMESITE: "lax",
  TRUST_PROXY: "true",
  AUTH_RATE_LIMIT: env.AUTH_RATE_LIMIT || "20",
  PUBLIC_API_RATE_LIMIT: env.PUBLIC_API_RATE_LIMIT || "300",
  CRON_SECRET: env.CRON_SECRET || "",
  RESEND_API_KEY: env.RESEND_API_KEY || "",
  AUTH_EMAIL_FROM: env.AUTH_EMAIL_FROM || "",
  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_OAUTH_REDIRECT_URI: env.GOOGLE_OAUTH_REDIRECT_URI || "",
  GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID || "",
  GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET || "",
  GITHUB_OAUTH_REDIRECT_URI: env.GITHUB_OAUTH_REDIRECT_URI || "",
});

const { createApp } = await import("../server/_core/app");
const app = createApp();
app.listen(3000);
const staticApiRoute = (pathname: string) =>
  pathname === "/health" ||
  pathname === "/ready" ||
  pathname === "/api" ||
  pathname.startsWith("/api/");

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.redirect(new URL(APP_BASE_PATH, request.url), 308);
    }

    if (staticApiRoute(url.pathname)) {
      const headers = new Headers(request.headers);
      headers.set("x-forwarded-proto", "https");
      headers.set("x-forwarded-host", url.host);
      const clientIp = request.headers.get("cf-connecting-ip");
      if (clientIp) headers.set("x-forwarded-for", clientIp);
      return handleAsNodeRequest(3000, new Request(request, { headers }));
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Route the SPA to index.html while keeping asset paths intact.
    const insideApp = url.pathname.startsWith(APP_BASE_PATH);
    if (!insideApp) {
      const correctedPath = APP_BASE_PATH + url.pathname.replace(/^\/+/, "");
      return Response.redirect(new URL(correctedPath + url.search, request.url), 308);
    }
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
