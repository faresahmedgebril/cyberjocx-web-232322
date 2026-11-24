import { describe, expect, it } from "vitest";
import { decryptCourseContent, encryptCourseContent } from "./content";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

describe("course content encryption", () => {
  it("encrypts and decrypts lesson text with AES-256-GCM", () => {
    const original = "Confidential course material";
    const encrypted = encryptCourseContent(original, TEST_KEY);
    expect(encrypted.ciphertext).not.toContain(original);
    expect(decryptCourseContent(encrypted, TEST_KEY)).toBe(original);
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.authTag).toBeTruthy();
    expect(encrypted.keyVersion).toBe("v1");
  });

  it("uses a fresh nonce for each encryption", () => {
    const first = encryptCourseContent("same", TEST_KEY);
    const second = encryptCourseContent("same", TEST_KEY);
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("rejects modified ciphertext", () => {
    const encrypted = encryptCourseContent("protected", TEST_KEY);
    const altered = { ...encrypted, ciphertext: Buffer.from("tampered").toString("base64") };
    expect(() => decryptCourseContent(altered, TEST_KEY)).toThrow();
  });

  it("rejects missing or invalid encryption keys", () => {
    expect(() => encryptCourseContent("hello", "invalid")).toThrow(/32-byte key/);
  });
});
