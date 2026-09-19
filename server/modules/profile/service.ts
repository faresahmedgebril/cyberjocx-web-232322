import { getPublicProfile, getDb } from "../../db";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getStorageProvider, profileObjectKey } from "../../infrastructure/storage/provider";
import { validationError } from "../../core/errors";

export async function readPublicProfile(userId: number) {
  const profile = await getPublicProfile(userId);
  if (!profile) return undefined;
  const { email: _email, phone: _phone, linkedinUrl: _linkedinUrl, ...publicUser } = profile.user;
  return { ...profile, user: publicUser };
}

export async function updateProfile(userId: number, input: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set(input).where(eq(users.id, userId));
  return { success: true } as const;
}

export async function uploadProfileMedia(userId: number, kind: "avatar" | "banner", dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw validationError("Please upload a valid PNG, JPG, or WEBP image.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength > 3 * 1024 * 1024) throw validationError("Image must not exceed 3 MB.");
  const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
  const stored = await getStorageProvider().put(profileObjectKey(userId, kind, extension), bytes, match[1]);
  await updateProfile(userId, kind === "avatar" ? { avatarUrl: stored.url } : { bannerUrl: stored.url });
  return stored;
}
