import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { sessionSecretFromEnv } from "./env";

export function appSecret(): string {
  return sessionSecretFromEnv();
}

export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function hmacHex(data: string, secret = appSecret()): string {
  return createHmac("sha256", secret).update(data, "utf8").digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isCheckId(id: string): boolean {
  return /^[A-Za-z0-9_-]{8,32}$/.test(id);
}
