import { describe, expect, it } from "vitest";
import { decodeOAuthState, encodeOAuthState } from "../shared/const";

describe("OAuth state contract", () => {
  it("round-trips redirect URI and nonce", () => {
    const value = { redirectUri: "https://cyberjocx.example/api/oauth/callback", nonce: "nonce-123" };
    expect(decodeOAuthState(encodeOAuthState(value))).toEqual(value);
  });

  it("rejects malformed state safely", () => {
    expect(decodeOAuthState("not-base64%%%" )).toEqual({ redirectUri: "" });
  });
});
