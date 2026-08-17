import { createHash, createHmac, randomUUID } from "node:crypto";

import { getServerEnv } from "@/lib/env";
import type { UploadSignInput } from "@/modules/storage/schema";

const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const hmac = (key: Buffer | string, value: string) => createHmac("sha256", key).update(value).digest();

export function createStorageKey(organizationId: string, input: UploadSignInput) {
  const extension = input.fileName.includes(".") ? input.fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") : undefined;
  return `${organizationId}/${input.category.toLowerCase()}/${input.entityId ?? "shared"}/${randomUUID()}${extension ? `.${extension}` : ""}`;
}

export function isOrganizationStorageKey(key: string, organizationId: string) {
  return key.startsWith(`${organizationId}/`) && !key.includes("..") && !key.includes("\\");
}

export function createPresignedStorageUrl(method: "GET" | "PUT", key: string, expiresSeconds = 300) {
  const env = getServerEnv();
  if (env.S3_PROVIDER === "mock") return { mode: "mock" as const, enabled: false, url: null, expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString() };
  const endpoint = new URL(env.S3_ENDPOINT!);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${env.S3_REGION}/s3/aws4_request`;
  const objectPath = env.S3_FORCE_PATH_STYLE ? `/${env.S3_BUCKET}/${key.split("/").map(encode).join("/")}` : `/${key.split("/").map(encode).join("/")}`;
  const host = env.S3_FORCE_PATH_STYLE ? endpoint.host : `${env.S3_BUCKET}.${endpoint.host}`;
  const query = new URLSearchParams({ "X-Amz-Algorithm": "AWS4-HMAC-SHA256", "X-Amz-Credential": `${env.S3_ACCESS_KEY_ID}/${scope}`, "X-Amz-Date": amzDate, "X-Amz-Expires": String(expiresSeconds), "X-Amz-SignedHeaders": "host" });
  const canonicalQuery = [...query.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${encode(k)}=${encode(v)}`).join("&");
  const canonicalRequest = `${method}\n${objectPath}\n${canonicalQuery}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hash(canonicalRequest)}`;
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${env.S3_SECRET_ACCESS_KEY}`, date), env.S3_REGION!), "s3"), "aws4_request");
  query.set("X-Amz-Signature", createHmac("sha256", signingKey).update(stringToSign).digest("hex"));
  const base = `${endpoint.protocol}//${host}${objectPath}`;
  return { mode: "s3" as const, enabled: true, url: `${base}?${query.toString()}`, expiresAt: new Date(now.getTime() + expiresSeconds * 1000).toISOString() };
}

export function createPresignedUpload(key: string, mimeType: string, maxSize: number, expiresSeconds = 300) {
  const env = getServerEnv();
  const expiresAt = new Date(Date.now() + expiresSeconds * 1000);
  if (env.S3_PROVIDER === "mock") return { mode: "mock" as const, enabled: false, url: null, fields: {}, expiresAt: expiresAt.toISOString() };
  const endpoint = new URL(env.S3_ENDPOINT!);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const credential = `${env.S3_ACCESS_KEY_ID}/${date}/${env.S3_REGION}/s3/aws4_request`;
  const policy = Buffer.from(JSON.stringify({ expiration: expiresAt.toISOString(), conditions: [
    { bucket: env.S3_BUCKET }, { key }, { "Content-Type": mimeType }, { "x-amz-algorithm": "AWS4-HMAC-SHA256" }, { "x-amz-credential": credential }, { "x-amz-date": amzDate }, ["content-length-range", 1, maxSize],
  ] })).toString("base64");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${env.S3_SECRET_ACCESS_KEY}`, date), env.S3_REGION!), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(policy).digest("hex");
  const host = env.S3_FORCE_PATH_STYLE ? endpoint.host : `${env.S3_BUCKET}.${endpoint.host}`;
  const path = env.S3_FORCE_PATH_STYLE ? `/${env.S3_BUCKET}` : "";
  return { mode: "s3" as const, enabled: true, url: `${endpoint.protocol}//${host}${path}`, fields: { key, "Content-Type": mimeType, "x-amz-algorithm": "AWS4-HMAC-SHA256", "x-amz-credential": credential, "x-amz-date": amzDate, policy, "x-amz-signature": signature }, expiresAt: expiresAt.toISOString() };
}
