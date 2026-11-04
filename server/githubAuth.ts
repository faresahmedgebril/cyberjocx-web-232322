import type { Express, Request, Response } from "express";
import { createSession, ensureGitHubUser, sessionCookie } from "./core/auth/session";
import { ENV } from "./config/env";
import { clearOAuthStateCookie, issueOAuthState, verifyOAuthState } from "./core/auth/oauthState";
import { logger } from "./core/logger";
import { getDatabaseErrorMetadata } from "./infrastructure/database/errorMetadata";

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const CLIENT_ID = ENV.GITHUB_CLIENT_ID;
const CLIENT_SECRET = ENV.GITHUB_CLIENT_SECRET;

function getGitHubCallbackUrl(req: Pick<Request, "protocol" | "get" | "headers">) {
  if (ENV.GITHUB_OAUTH_REDIRECT_URI) return ENV.GITHUB_OAUTH_REDIRECT_URI;
  const protocol = String(req.headers["x-forwarded-proto"] ?? req.protocol).split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] ?? req.get("host") ?? "").split(",")[0].trim();
  if (!host) throw new Error("GitHub OAuth callback host is unavailable");
  return protocol + "://" + host + "/api/auth/github/callback";
}

function loginUrl(reason: string) {
  return (ENV.APP_WEB_URL ? ENV.APP_WEB_URL.replace(/\/+$/, "") : "") + "/login?authError=" + encodeURIComponent(reason);
}

function appHomeUrl() {
  const base = ENV.APP_WEB_URL ? ENV.APP_WEB_URL.replace(/\/+$/, "") : "";
  return base + "/";
}

export function registerGitHubAuthRoutes(app: Express) {
  app.get("/api/auth/github/login", (req: Request, res: Response) => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      res.redirect(302, loginUrl("github-not-configured"));
      return;
    }
    const state = issueOAuthState(res, "github");
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
    if (!CLIENT_ID || !CLIENT_SECRET) {
      res.redirect(302, loginUrl("github-not-configured"));
      return;
    }
    const validState = verifyOAuthState(req, "github", state);
    if (!code || !validState) {
      res.setHeader("Set-Cookie", clearOAuthStateCookie("github"));
      res.redirect(302, loginUrl("github-state"));
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

      const headers = {
        Authorization: "Bearer " + tokens.access_token,
        Accept: "application/vnd.github+json",
        "User-Agent": "CyberJocx",
      };
      const profileResponse = await fetch("https://api.github.com/user", { headers });
      if (!profileResponse.ok) throw new Error("GitHub profile request failed");
      const profile = await profileResponse.json() as {
        id?: number; name?: string | null; login?: string; avatar_url?: string | null;
      };
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
      const secure = req.secure || String(req.headers["x-forwarded-proto"] ?? "").split(",").some(value => value.trim().toLowerCase() === "https");
      res.setHeader("Set-Cookie", [clearOAuthStateCookie("github"), sessionCookie(token, secure)]);
      res.redirect(302, appHomeUrl());
    } catch (error) {
      res.setHeader("Set-Cookie", clearOAuthStateCookie("github"));
      logger.error("[GitHub OAuth] callback failed", getDatabaseErrorMetadata(error));
      res.redirect(302, loginUrl("github"));
    }
  });
}
