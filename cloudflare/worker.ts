import { Client } from "pg";

interface Env {
  HYPERDRIVE: { connectionString: string };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "cyberjocx-api", runtime: "cloudflare-workers" });
    }

    if (request.method === "GET" && url.pathname === "/ready") {
      const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
      try {
        await client.connect();
        await client.query("select 1");
        return json({ ok: true, database: true });
      } catch {
        return json({ ok: false, database: false }, 503);
      } finally {
        await client.end().catch(() => undefined);
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return json({
        ok: false,
        code: "API_MIGRATION_IN_PROGRESS",
        message: "This endpoint has not been migrated to the Workers runtime yet.",
      }, 501);
    }

    return json({ ok: false, message: "Not found" }, 404);
  },
};
