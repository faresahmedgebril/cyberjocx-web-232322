type ErrorRecord = Record<string, unknown>;

function asRecord(value: unknown): ErrorRecord | undefined {
  return value !== null && typeof value === "object"
    ? value as ErrorRecord
    : undefined;
}

function safeIdentifier(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_.-]{1,128}$/.test(value)) return undefined;
  return value;
}

/**
 * Extract only stable PostgreSQL diagnostic fields from a Drizzle/pg error
 * chain. Never log SQL text, parameter values, OAuth codes, emails or tokens.
 */
export function getDatabaseErrorMetadata(error: unknown): Record<string, string> {
  const metadata: Record<string, string> = {
    errorType: error instanceof Error ? error.name : typeof error,
  };
  const visited = new Set<unknown>();
  let current: unknown = error;

  for (let depth = 0; depth < 4 && current && !visited.has(current); depth += 1) {
    visited.add(current);
    const record = asRecord(current);
    if (!record) break;

    if (!metadata.sqlState && typeof record.code === "string" && /^[0-9A-Z]{5}$/.test(record.code)) {
      metadata.sqlState = record.code;
    }
    if (!metadata.severity) {
      const severity = safeIdentifier(record.severity);
      if (severity) metadata.severity = severity;
    }
    for (const field of ["schema", "table", "column", "constraint", "dataType"] as const) {
      const key = field === "dataType" ? "dataType" : field;
      if (!metadata[key]) {
        const value = safeIdentifier(record[field]);
        if (value) metadata[key] = value;
      }
    }

    current = record.cause;
  }

  return metadata;
}
