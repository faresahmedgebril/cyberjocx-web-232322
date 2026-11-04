import { describe, expect, it } from "vitest";
import { getDatabaseErrorMetadata } from "./errorMetadata";

describe("getDatabaseErrorMetadata", () => {
  it("extracts safe PostgreSQL fields from nested causes", () => {
    const error = new Error("Query failed", {
      cause: Object.assign(new Error("database rejected a write"), {
        code: "23505",
        severity: "ERROR",
        schema: "public",
        table: "users",
        constraint: "users_openId_unique",
      }),
    });

    expect(getDatabaseErrorMetadata(error)).toEqual({
      errorType: "Error",
      sqlState: "23505",
      severity: "ERROR",
      schema: "public",
      table: "users",
      constraint: "users_openId_unique",
    });
  });

  it("does not expose arbitrary SQL, parameters or unsafe identifiers", () => {
    const error = Object.assign(new Error("insert users ... params: private-value"), {
      code: "not-a-sqlstate",
      table: "users; DROP TABLE users",
      column: "email@example.com",
      detail: "private user data",
    });

    const metadata = getDatabaseErrorMetadata(error);
    expect(metadata).toEqual({ errorType: "Error" });
    expect(JSON.stringify(metadata)).not.toContain("private");
    expect(JSON.stringify(metadata)).not.toContain("email");
    expect(JSON.stringify(metadata)).not.toContain("DROP TABLE");
  });
});
