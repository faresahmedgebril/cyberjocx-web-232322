import type { Express, Request, Response } from "express";
import { createSession, ensureGoogleUser, sessionCookie } from "./core/auth/session";
import { ENV } from "./config/env";
import { clearOAuthStateCookie, issueOAuthState, verifyOAuthState } from "./core/auth/oauthState";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

function callbackUrl(req: Request) {
  if (ENV.GOOGLE_OAUTH_REDIRECT_URI) return ENV.GOOGLE_OAUTH_REDIRECT_URI;
  const forwardedProto = String(req.headers["x-forwarded-proto"] ?? req.protocol).split(",")[0].trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] ?? req.get("host") ?? "").split(",")[0].trim();
  if (!forwardedHost) throw new Error("Google OAuth callback host is unavailable");
  return `${forwardedProto}://${forwardedHost}/api/auth/google/callback`;
}

export function getGoogleCallbackUrl(req: Pick<Request, "protocol" | "get" | "headers">, configuredRedirect = ENV.GOOGLE_OAUTH_REDIRECT_URI) {
  if (configuredRedirect) return configuredRedirect;
  const protocol = String(req.headers["x-forwarded-proto"] ?? req.protocol).split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] ?? req.get("host") ?? "").split(",")[0].trim();
  if (!host) throw new Error("Google OAuth callback host is unavailable");
  return `${protocol}://${host}/api/auth/google/callback`;
}

function requireGoogleConfig() {
  if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) throw new Error("Google OAuth is not configured");
  return { clientId: ENV.GOOGLE_CLIENT_ID, clientSecret: ENV.GOOGLE_CLIENT_SECRET };
}

function loginUrl(reason: string) {
  return (ENV.APP_WEB_URL ? ENV.APP_WEB_URL.replace(/\/+$/, "") : "") + "/login?authError=" + encodeURIComponent(reason);
}

function appHomeUrl() {
  const base = ENV.APP_WEB_URL ? ENV.APP_WEB_URL.replace(/\/+$/, "") : "";
  return base + "/";
}

export function registerGoogleAuthRoutes(app: Express) {
  app.get("/api/auth/google/login", (req: Request, res: Response) => {
    try {
      const { clientId } = requireGoogleConfig();
      const state = issueOAuthState(res, "google");
      const url = new URL(GOOGLE_AUTHORIZE_URL);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", callbackUrl(req));
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("prompt", "select_account");
      res.redirect(302, url.toString());
    } catch {
      res.redirect(302, loginUrl("google-not-configured"));
    }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const validState = verifyOAuthState(req, "google", state);
    if (!code || !validState) {
      res.setHeader("Set-Cookie", clearOAuthStateCookie("google"));
      res.redirect(302, loginUrl("google-state"));
      return;
    }

    try {
      const { clientId, clientSecret } = requireGoogleConfig();
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl(req),
          grant_type: "authorization_code",
        }),
      });
      if (!tokenResponse.ok) throw new Error("Google token exchange failed");
      const tokens = await tokenResponse.json() as { access_token?: string };
      if (!tokens.access_token) throw new Error("Google access token missing");

      const userResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!userResponse.ok) throw new Error("Google user profile request failed");
      const googleUser = await userResponse.json() as {
        sub?: string; email?: string; name?: string; picture?: string; email_verified?: boolean;
      };
      if (!googleUser.sub || !googleUser.email || !googleUser.email_verified) {
        throw new Error("Google account must have a verified email");
      }

      const user = await ensureGoogleUser({
        openId: `google:${googleUser.sub}`,
        name: googleUser.name,
        email: googleUser.email,
        avatarUrl: googleUser.picture,
      });
      const { token } = await createSession(user.id, req);
      const secure = req.protocol === "https" || String(req.headers["x-forwarded-proto"] ?? "").includes("https");
      res.setHeader("Set-Cookie", [clearOAuthStateCookie("google"), sessionCookie(token, secure)]);
      res.redirect(302, appHomeUrl());
    } catch (error) {
      res.setHeader("Set-Cookie", clearOAuthStateCookie("google"));
      const e = error as any;
      console.error("[Google OAuth] callback failed", {
        name: e?.name,
        message: e?.message,
        code: e?.code,
        errno: e?.errno,
        sqlState: e?.sqlState,
        sqlMessage: e?.sqlMessage,
        cause: e?.cause?.message ?? e?.cause,
        stack: e?.stack,
      });
      res.redirect(302, loginUrl("google"));
    }
  });
}
