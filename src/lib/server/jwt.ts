import { createHmac } from "node:crypto";
import { appSecret } from "./secret";
import type { Role } from "./roles";

type JwtHeader = { alg: "HS256"; typ: "JWT" };

export type SessionClaims = {
  sub: string;
  role: Role;
  amr: string[];
  iat: number;
  exp: number;
};

function b64url(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return buf.toString("base64url");
}

function parseB64url(part: string): string {
  return Buffer.from(part, "base64url").toString("utf8");
}

function sign(input: string, secret = appSecret()): string {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

export function signSession(claims: Omit<SessionClaims, "iat" | "exp">, ttlSec = 12 * 60 * 60): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionClaims = { ...claims, iat: now, exp: now + ttlSec };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" } satisfies JwtHeader));
  const body = b64url(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifySession(token: string, secret = appSecret()): SessionClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const unsigned = `${header}.${body}`;
  const expected = sign(unsigned, secret);
  if (expected.length !== sig.length) return null;
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return null;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  if (diff !== 0) return null;
  try {
    const claims = JSON.parse(parseB64url(body)) as SessionClaims;
    if (claims.exp * 1000 < Date.now()) return null;
    if (!claims.sub || !claims.role) return null;
    return claims;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "pc_session";

export function sessionCookie(token: string, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${12 * 60 * 60}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(secure: boolean): string {
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function readSessionCookie(req: Request): string | null {
  const raw = req.headers.get("cookie") || "";
  const hit = raw.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${SESSION_COOKIE}=`));
  if (!hit) return null;
  return hit.slice(SESSION_COOKIE.length + 1) || null;
}
