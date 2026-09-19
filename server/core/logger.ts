type LogLevel = "debug" | "info" | "warn" | "error";
const levels: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const configured = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";

function sanitize(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitize);
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (/password|secret|token|authorization|cookie|api[-_]?key|code/i.test(key)) output[key] = "[REDACTED]";
    else output[key] = sanitize(entry);
  }
  return output;
}

function write(level: LogLevel, message: string, meta?: unknown) {
  if (levels[level] < levels[configured]) return;
  const record = { timestamp: new Date().toISOString(), level, message, ...(meta ? { meta: sanitize(meta) } : {}) };
  const line = JSON.stringify(record);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
