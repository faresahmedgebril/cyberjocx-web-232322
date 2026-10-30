import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle-postgres",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit generate reads the schema without connecting. The placeholder
    // keeps local/CI generation possible before a Neon DATABASE_URL is configured.
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cyberjocx",
  },
});
