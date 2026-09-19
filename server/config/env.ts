import "dotenv/config";
import { z } from "zod";

const bool = z.preprocess(value => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}, z.boolean()).default(false);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SERVICE_ROLE: z.enum(["api", "worker", "cron"]).default("api"),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_WEB_URL: z.string().url().optional(),
  API_BASE_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
  SESSION_TTL_MS: z.coerce.number().int().positive().default(1000 * 60 * 60 * 24 * 30),
  SESSION_COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
  SESSION_COOKIE_SECURE: bool,
  OWNER_OPEN_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
  STORAGE_PROVIDER: z.enum(["s3", "r2"]).default("s3"),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_REGION: z.string().default("auto"),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_PUBLIC_BASE_URL: z.string().url().optional(),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  AI_VISION_MODEL: z.string().default("gpt-4o-mini"),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(1200),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  CRON_SECRET: z.string().min(16).optional(),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(20),
  AI_RATE_LIMIT: z.coerce.number().int().positive().default(20),
  PUBLIC_API_RATE_LIMIT: z.coerce.number().int().positive().default(300),
  USER_MUTATION_RATE_LIMIT: z.coerce.number().int().positive().default(120),
  ADMIN_RATE_LIMIT: z.coerce.number().int().positive().default(120),
  NVD_API_URL: z.string().url().default("https://services.nvd.nist.gov/rest/json/cves/2.0"),
  NVD_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_ANALYTICS_ENDPOINT: z.string().url().optional(),
  VITE_ANALYTICS_WEBSITE_ID: z.string().optional(),
  TRUST_PROXY: bool,
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

const raw = parsed.data;
if (raw.NODE_ENV === "production") {
  const required = raw.SERVICE_ROLE === "worker"
    ? ["DATABASE_URL"] as const
    : ["DATABASE_URL", "JWT_SECRET", "APP_WEB_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI", "STORAGE_BUCKET", "STORAGE_ACCESS_KEY", "STORAGE_SECRET_KEY", "CRON_SECRET"] as const;
  const missing = required.filter(key => !raw[key]);
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  if (raw.SERVICE_ROLE === "api") {
    if (raw.CORS_ORIGINS === "http://localhost:3000") throw new Error("CORS_ORIGINS must be configured for the production frontend");
    if (raw.SESSION_COOKIE_SAMESITE === "none" && !raw.SESSION_COOKIE_SECURE) throw new Error("SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAMESITE=none");
  }
}

export const ENV = {
  ...raw,
  corsOrigins: raw.CORS_ORIGINS.split(",").map(value => value.trim()).filter(Boolean),
  isProduction: raw.NODE_ENV === "production",
  isTest: raw.NODE_ENV === "test",
};

export type AppEnv = typeof ENV;
