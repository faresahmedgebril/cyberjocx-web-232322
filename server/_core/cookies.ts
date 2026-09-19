import type { CookieOptions, Request } from "express";
import { ENV } from "../config/env";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  const forwarded = req.headers["x-forwarded-proto"];
  return (Array.isArray(forwarded) ? forwarded : forwarded?.split(",") ?? []).some(value => value.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: Request): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    domain: ENV.SESSION_COOKIE_DOMAIN,
    httpOnly: true,
    path: "/",
    sameSite: ENV.SESSION_COOKIE_SAMESITE,
    secure: ENV.SESSION_COOKIE_SECURE || isSecureRequest(req),
  };
}
