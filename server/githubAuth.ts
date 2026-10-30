import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import { createSession, ensureGitHubUser, sessionCookie } from "./core/auth/session";
import { ENV } from "./config/env";
import { getSessionCookieOptions } from "./_core/cookies";

const STATE_COOKIE = "cyberjocx_github_oauth_state";
const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

function secureRequest(req: Request) {
  return req.secure || String(req.headers["x-forwarded-proto"] ?? "").split(",").some(value => value.trim().toLowerCase() === "https");
}
export function getGitHubCallbackUrl(req: Pick<Request, "protocol" | "get" | "headers">, configuredRedirect = process.env.GITHUB_OAUTH_REDIRECT_URI) {
  if (configuredRedirect) return configuredRedirect;
  const protocol = String(req.headers["x-forwarded-proto"] ?? req.protocol).split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] ?? req.get("host") ?? "").split(",")[0].trim();
  if (!host) throw new Error("GitHub OAuth callback host is unavailable");
  return protocol + "://" + host + "/api/auth/github/callback";
}
function loginUrl(reason: string) {
  return (ENV.APP_WEB_URL ? ENV.APP_WEB_URL.replace(/\/+$/, "") : "") + "/login?authError=" + encodeURIComponent(reason);
}

export function registerGitHubAuthRoutes(app: Express) {
  app.get("/api/auth/github/login", (req: Request, res: Response) => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      res.redirect(302, loginUrl("github-not-configured"));
      return;
    }
    const state = crypto.randomBytes(32).toString("base64url");
    res.cookie(STATE_COOKIE, state, { ...getSessionCookieOptions(req), sameSite: "lax", maxAge: 10 * 60 * 1000 });
    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", getGitHubCallbackUrl(req));
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", state);
    res.redirect(302, url.toString());
  });

  app.get("/api/auth/github/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const cookieState = parseCookieHeader(req.headers.cookie ?? "")[STATE_COOKIE] ?? "";
    const validState = Boolean(code && state && cookieState) &&
      Buffer.byteLength(state) === Buffer.byteLength(cookieState) &&
      crypto.timingSafeEqual(Buffer.from(state), Buffer.from(cookieState));
    res.clearCookie(STATE_COOKIE, { ...getSessionCookieOptions(req), sameSite: "lax" });
    if (!validState || !CLIENT_ID || !CLIENT_SECRET) {
      res.redirect(302, loginUrl(!CLIENT_ID || !CLIENT_SECRET ? "github-not-configured" : "github"));
      return;
    }
    try {
      const redirectUri = getGitHubCallbackUrl(req);
      const tokenResponse = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: redirectUri }),
      });
      if (!tokenResponse.ok) throw new Error("GitHub token exchange failed");
      const tokens = await tokenResponse.json() as { access_token?: string; error?: string };
      if (!tokens.access_token) throw new Error(tokens.error || "GitHub access token is missing");
      const headers = { Authorization: "Bearer " + tokens.access_token, Accept: "application/vnd.github+json", "User-Agent": "CyberJocx" };
      const profileResponse = await fetch("https://api.github.com/user", { headers });
      if (!profileResponse.ok) throw new Error("GitHub profile request failed");
      const profile = await profileResponse.json() as { id?: number; name?: string | null; login?: string; avatar_url?: string | null };
      if (!profile.id) throw new Error("GitHub profile ID is missing");
      const emailsResponse = await fetch("https://api.github.com/user/emails", { headers });
      if (!emailsResponse.ok) throw new Error("GitHub email verification failed");
      const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
      const email = emails.find(item => item.primary && item.verified)?.email;
      if (!email) throw new Error("A verified primary GitHub email is required");
      const user = await ensureGitHubUser({
        openId: "github:" + profile.id,
        name: profile.name || profile.login || "GitHub User",
        email,
        avatarUrl: profile.avatar_url,
      });
      const { token } = await createSession(user.id, req);
      res.setHeader("Set-Cookie", sessionCookie(token, secureRequest(req)));
      res.redirect(302, ENV.APP_WEB_URL ?? "/");
    } catch (error) {
      console.error("[GitHub OAuth] callback failed", error instanceof Error ? error.message : String(error));
      res.redirect(302, loginUrl("github"));
    }
  });
}
