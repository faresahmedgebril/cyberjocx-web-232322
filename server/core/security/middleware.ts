import type { NextFunction, Request, Response } from "express";
import { ENV } from "../../config/env";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (origin && ENV.corsOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(origin && ENV.corsOrigins.includes(origin) ? 204 : 403);
  next();
}

export function rateLimit(limit: number, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + windowMs });
    else current.count += 1;
    const bucket = buckets.get(key)!;
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - bucket.count));
    if (bucket.count > limit) return res.status(429).json({ error: "Too many requests" });
    next();
  };
}

export function validateStateChangingOrigin(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const allowed = ENV.corsOrigins.some(value => origin === value || referer?.startsWith(value));
  if (!allowed && ENV.isProduction) return res.status(403).json({ error: "Origin validation failed" });
  next();
}
