import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STEP = 30;
const DIGITS = 6;

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
}

export function newTotpSecret(): string {
  return randomBytes(20).toString("base64url");
}

export function totpCode(secretB64: string, at = Date.now()): string {
  const secret = Buffer.from(secretB64, "base64url");
  const counter = Math.floor(at / 1000 / STEP);
  return hotp(secret, counter);
}

export function verifyTotp(secretB64: string, code: string, at = Date.now()): boolean {
  const trimmed = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(trimmed)) return false;
  const secret = Buffer.from(secretB64, "base64url");
  const counter = Math.floor(at / 1000 / STEP);
  const want = Buffer.from(trimmed);
  for (const c of [counter - 1, counter, counter + 1]) {
    const got = Buffer.from(hotp(secret, c));
    if (got.length === want.length && timingSafeEqual(got, want)) return true;
  }
  return false;
}

export function otpauthUrl(secretB64: string, account: string): string {
  const secret = Buffer.from(secretB64, "base64url").toString("base64").replace(/=+$/, "");
  const label = encodeURIComponent(`PropertyCheck:${account}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=PropertyCheck&digits=6&period=30`;
}
