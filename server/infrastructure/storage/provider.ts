import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import { ENV } from "../../config/env";
import { externalServiceError, validationError } from "../../core/errors";

export interface StorageProvider {
  put(key: string, body: Buffer, contentType: string): Promise<{ key: string; url: string }>;
  signedUpload(key: string, contentType: string): Promise<{ key: string; url: string }>;
  signedDownload(key: string): Promise<string>;
}

function safeKey(key: string) {
  const normalized = key.replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\\")) throw validationError("Invalid storage key");
  return normalized;
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  constructor() {
    if (!ENV.STORAGE_BUCKET || !ENV.STORAGE_ACCESS_KEY || !ENV.STORAGE_SECRET_KEY) throw new Error("Storage configuration is incomplete");
    this.client = new S3Client({ region: ENV.STORAGE_REGION, endpoint: ENV.STORAGE_ENDPOINT, forcePathStyle: ENV.STORAGE_PROVIDER === "s3", credentials: { accessKeyId: ENV.STORAGE_ACCESS_KEY, secretAccessKey: ENV.STORAGE_SECRET_KEY } });
  }
  private url(key: string) { return ENV.STORAGE_PUBLIC_BASE_URL ? `${ENV.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}/${encodeURIComponent(key).replace(/%2F/g, "/")}` : key; }
  async put(key: string, body: Buffer, contentType: string) {
    const normalized = safeKey(key);
    try { await this.client.send(new PutObjectCommand({ Bucket: ENV.STORAGE_BUCKET, Key: normalized, Body: body, ContentType: contentType })); return { key: normalized, url: this.url(normalized) }; }
    catch (error) { throw externalServiceError("Storage upload failed", error); }
  }
  async signedUpload(key: string, contentType: string) {
    const normalized = safeKey(key);
    const url = await getSignedUrl(this.client, new PutObjectCommand({ Bucket: ENV.STORAGE_BUCKET, Key: normalized, ContentType: contentType }), { expiresIn: 900 });
    return { key: normalized, url };
  }
  async signedDownload(key: string) {
    const normalized = safeKey(key);
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: ENV.STORAGE_BUCKET, Key: normalized }), { expiresIn: 900 });
  }
}

let provider: StorageProvider | undefined;
export function getStorageProvider() {
  provider ??= new S3StorageProvider();
  return provider;
}
export function profileObjectKey(userId: number, kind: "avatar" | "banner", extension: string) { return `profiles/${userId}/${kind}-${crypto.randomUUID()}.${extension}`; }
