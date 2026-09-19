import { describe, expect, it } from "vitest";
import { getGoogleCallbackUrl } from "./googleAuth";

function callbackRequest(headers: Record<string, string | undefined>, protocol = "http") {
  return { protocol, headers, get: (name: string) => headers[name.toLowerCase()] };
}

describe("Google OAuth configuration", () => {
  it("uses forwarded public origin when no explicit redirect is configured", () => {
    const callback = getGoogleCallbackUrl(callbackRequest({ host: "internal.example", "x-forwarded-host": "api.cyberjocx.example", "x-forwarded-proto": "https" }), undefined);
    expect(callback).toBe("https://api.cyberjocx.example/api/auth/google/callback");
  });

  it("uses the explicitly configured callback URL", () => {
    const callback = getGoogleCallbackUrl(callbackRequest({ host: "internal.example" }), "https://api.example.com/api/auth/google/callback");
    expect(callback).toBe("https://api.example.com/api/auth/google/callback");
  });
});
