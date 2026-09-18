/**
 * Typed reads of process.env. Secrets and keys never live in UI strings.
 */

export function readEnv(name: string, fallback = ""): string {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return String(raw).trim();
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Fallback only for local `next dev`. Never ship this as a real secret. */
export const DEV_SECRET_FALLBACK = "dev-only-change-me";

export function sessionSecretFromEnv(): string {
  const secret = readEnv("SESSION_SECRET") || readEnv("DJANGO_SECRET_KEY");
  if (secret) return secret;
  if (isProduction()) {
    throw new Error("SESSION_SECRET or DJANGO_SECRET_KEY must be set in production");
  }
  return DEV_SECRET_FALLBACK;
}

export function llmExplainUrl(): string {
  return readEnv("LLM_EXPLAIN_URL");
}

export function llmExplainKey(): string {
  return readEnv("LLM_EXPLAIN_KEY");
}
