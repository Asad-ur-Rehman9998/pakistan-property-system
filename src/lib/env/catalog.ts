/**
 * Environment configuration contract.
 * Real values live in `.env` (gitignored). Only `.env.example` is committed.
 */

export const ENV_RULE =
  "Use .env.example as the template. Never commit .env, API keys, passwords, secret keys, database credentials, or private tokens.";

/** Keys documented in `.env.example` — extend here when adding a new env var. */
export const ENV_KEYS = [
  "SESSION_SECRET",
  "DJANGO_SECRET_KEY",
  "DJANGO_DEBUG",
  "DJANGO_ALLOWED_HOSTS",
  "STAFF_OWNER_EMAIL",
  "CHECKS_DIR",
  "DJANGO_API_URL",
  "DATABASE_URL",
  "AWS_STORAGE_BUCKET_NAME",
  "AWS_S3_ENDPOINT_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "LLM_EXPLAIN_URL",
  "LLM_EXPLAIN_KEY",
  "PLAN_CURRENCY",
  "PLAN_PRICE_PREMIUM",
  "PLAN_PRICE_DEALER",
  "PLAN_PRICE_PROFESSIONAL",
  "ANALYTICS_DIR",
  "USERS_DIR",
  "AUDIT_DIR",
  "BILLING_DIR",
  "COMPLAINTS_DIR",
  "REVIEWS_DIR",
  "E2E_URL",
] as const;

export type EnvKey = (typeof ENV_KEYS)[number];

/** These must be empty (or absent) in the committed `.env.example`. */
export const SECRET_ENV_KEYS = [
  "SESSION_SECRET",
  "DJANGO_SECRET_KEY",
  "DATABASE_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "LLM_EXPLAIN_KEY",
  "PLAN_PRICE_PREMIUM",
  "PLAN_PRICE_DEALER",
  "PLAN_PRICE_PROFESSIONAL",
] as const;

export const NEVER_COMMIT = [
  ".env",
  "API keys",
  "passwords",
  "secret keys",
  "database credentials",
  "private tokens",
] as const;

export const ENV_EXAMPLE_PATH = ".env.example";
export const GITIGNORE_PATH = ".gitignore";
