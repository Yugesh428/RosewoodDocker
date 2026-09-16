/**
 * Storage utility — local filesystem for now, S3-ready for later.
 *
 * When migrating to S3:
 *   1. Set STORAGE_PROVIDER=s3 in .env
 *   2. Add AWS_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   3. Replace the local save/delete logic below with @aws-sdk/client-s3 calls
 *   4. No changes needed in controllers — they only call storage.save() / storage.delete()
 */

/* eslint-disable @typescript-eslint/no-require-imports */
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const PROVIDER = process.env.STORAGE_PROVIDER ?? "local"; // "local" | "s3"
const BASE_DIR  = path.join(process.cwd(), "public", "uploads");
const BASE_URL  = "/uploads"; // public URL prefix

export interface StorageResult {
  url: string;      // public-accessible URL to store in DB
  localPath?: string; // full local path (only for local storage)
}

/**
 * Save a File (from FormData) to storage.
 * @param file     - Web File object from formData.get("field")
 * @param folder   - Sub-folder name, e.g. "hero", "products"
 * @returns StorageResult with public URL
 */
export async function storageSave(file: File, folder: string): Promise<StorageResult> {
  if (PROVIDER === "s3") {
    // ── Future S3 implementation ──────────────────────────────────────────────
    // const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
    // const client = new S3Client({ region: process.env.AWS_REGION });
    // const key = `${folder}/${uuidv4()}${path.extname(file.name)}`;
    // await client.send(new PutObjectCommand({
    //   Bucket: process.env.AWS_BUCKET,
    //   Key: key,
    //   Body: Buffer.from(await file.arrayBuffer()),
    //   ContentType: file.type,
    //   ACL: "public-read",
    // }));
    // return { url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}` };
    throw new Error("S3 storage not yet implemented. Set STORAGE_PROVIDER=local.");
  }

  // ── Local storage ─────────────────────────────────────────────────────────
  const uploadDir = path.join(BASE_DIR, folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext      = path.extname(file.name).toLowerCase() || ".jpg";
  const filename = `${uuidv4()}${ext}`;
  const fullPath = path.join(uploadDir, filename);

  fs.writeFileSync(fullPath, Buffer.from(await file.arrayBuffer()));

  const url = `${BASE_URL}/${folder}/${filename}`;
  return { url, localPath: fullPath };
}

/**
 * Delete a file from storage by its public URL.
 * @param url - The public URL previously returned by storageSave()
 */
export async function storageDelete(url: string): Promise<void> {
  if (!url) return;

  if (PROVIDER === "s3") {
    // ── Future S3 delete ──────────────────────────────────────────────────────
    // const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
    // const client = new S3Client({ region: process.env.AWS_REGION });
    // const key = new URL(url).pathname.slice(1); // strip leading /
    // await client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: key }));
    return;
  }

  // ── Local delete ──────────────────────────────────────────────────────────
  // Convert public URL back to local file path
  if (!url.startsWith(BASE_URL)) return;
  const relativePath = url.slice(BASE_URL.length); // e.g. /hero/uuid.jpg
  const fullPath = path.join(BASE_DIR, relativePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * Check if a URL is a local upload (vs external URL like Unsplash).
 * Used to decide whether to delete on update.
 */
export function isLocalUpload(url: string): boolean {
  return url.startsWith(BASE_URL);
}

export const storage = {
  save:         storageSave,
  delete:       storageDelete,
  isLocalUpload,
};
