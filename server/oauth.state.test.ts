import { describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import { issueOAuthState, verifyOAuthState } from "./core/auth/oauthState";

function responseWithCookies() {
  const cookies: string[] = [];
  const res = { append: (_name: string, value: string) => cookies.push(value) } as unknown as Response;
  return { res, cookies };
}

function requestWithCookie(cookie: string) {
  return { headers: { cookie } } as Request;
}

describe("OAuth state cookie protection", () => {
  it("issues a high-entropy state in a Secure HttpOnly SameSite=Lax cookie", () => {
    const { res, cookies } = responseWithCookies();
    const state = issueOAuthState(res, "google");
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(cookies[0]).toContain("__Host-cyberjocx_google_oauth_state=" + state);
    expect(cookies[0]).toContain("HttpOnly");
    expect(cookies[0]).toContain("Secure");
    expect(cookies[0]).toContain("SameSite=Lax");
    expect(cookies[0]).toContain("Path=/");
  });

  it("accepts only the state bound to the same provider cookie", () => {
    const { res, cookies } = responseWithCookies();
    const state = issueOAuthState(res, "github");
    expect(verifyOAuthState(requestWithCookie(cookies[0]!), "github", state)).toBe(true);
    expect(verifyOAuthState(requestWithCookie(cookies[0]!), "google", state)).toBe(false);
    expect(verifyOAuthState(requestWithCookie(cookies[0]!), "github", state + "x")).toBe(false);
    expect(verifyOAuthState(requestWithCookie(""), "github", state)).toBe(false);
  });
});
