import crypto from "node:crypto";
import { ENV } from "../../config/env";

export type EncryptedCourseContent = {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: "v1";
};

function resolveKey(keyValue = ENV.COURSE_CONTENT_ENCRYPTION_KEY): Buffer {
  if (!keyValue) throw new Error("Course content encryption is not configured.");
  const key = Buffer.from(keyValue, "base64");
  if (key.length !== 32 || key.toString("base64").replace(/=+$/, "") !== keyValue.replace(/=+$/, "")) {
    throw new Error("COURSE_CONTENT_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  return key;
}

export function encryptCourseContent(plaintext: string, keyValue?: string): EncryptedCourseContent {
  if (!plaintext.trim()) throw new Error("Course lesson content cannot be empty.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", resolveKey(keyValue), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion: "v1",
  };
}

export function decryptCourseContent(
  encrypted: Pick<EncryptedCourseContent, "ciphertext" | "iv" | "authTag">,
  keyValue?: string,
): string {
  const decipher = crypto.createDecipheriv("aes-256-gcm", resolveKey(keyValue), Buffer.from(encrypted.iv, "base64"));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
