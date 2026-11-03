import crypto from "node:crypto";
import type { Request, Response } from "express";

export type OAuthProvider = "google" | "github";

const STATE_TTL_SECONDS = 10 * 60;
const COOKIE_NAMES: Record<OAuthProvider, string> = {
  google: "__Host-cyberjocx_google_oauth_state",
  github: "__Host-cyberjocx_github_oauth_state",
};

function cookieValue(req: Request, name: string) {
  const prefix = name + "=";
  const item = req.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(prefix));
  return item ? item.slice(prefix.length) : undefined;
}

export function clearOAuthStateCookie(provider: OAuthProvider) {
  return COOKIE_NAMES[provider] + "=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export function issueOAuthState(res: Response, provider: OAuthProvider) {
  const state = crypto.randomBytes(32).toString("base64url");
  res.append(
    "Set-Cookie",
    COOKIE_NAMES[provider] + "=" + state +
      "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" + STATE_TTL_SECONDS
  );
  return state;
}

export function verifyOAuthState(req: Request, provider: OAuthProvider, suppliedState: unknown) {
  if (typeof suppliedState !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(suppliedState)) return false;
  const expectedState = cookieValue(req, COOKIE_NAMES[provider]);
  if (!expectedState || expectedState.length !== suppliedState.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedState), Buffer.from(suppliedState));
}
