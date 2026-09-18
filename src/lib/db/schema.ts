/**
 * PostgreSQL layout owned by Django (`api/checks/models.py`).
 *
 * Guest checks do not need a user row. Papers never have a column.
 * PropertyListing is a found-via card or dealer information page — not a marketplace.
 * Lead / Appointment are verification follow-ups and visits — not a sales CRM.
 */

export const POSTGRES_TABLES = [
  "users",
  "profiles",
  "dealers",
  "customers",
  "properties",
  "property_locations",
  "property_documents",
  "document_extractions",
  "verification_requests",
  "property_checks",
  "risk_indicators",
  "property_comparisons",
  "property_listings",
  "leads",
  "appointments",
  "reports",
  "audit_logs",
  "plans",
  "subscriptions",
  "payments",
  "notifications",
] as const;

export type PostgresTable = (typeof POSTGRES_TABLES)[number];

/** Columns that must never exist. Hashes and last-4 digits are allowed elsewhere. */
export const FORBIDDEN_COLUMNS = [
  "share_key",
  "password",
  "pan",
  "cvv",
  "card_number",
  "full_cnic",
  "cnic",
  "photo_bytes",
  "document_blob",
  "pipeline_stage",
  "deal_value",
] as const;

export const UUID_TABLES = POSTGRES_TABLES;

export const INDEXED_LOOKUPS = {
  users: ["email", "role", "created_at"],
  properties: ["plot_number", "khasra_number", "society_name"],
  property_locations: ["city", "area", "province"],
  property_documents: ["kind", "image_print"],
  property_checks: ["public_id", "user", "created_at", "share_token_hash"],
  reports: ["verdict", "info_status"],
  audit_logs: ["ts", "action", "actor"],
  notifications: ["user", "read_at", "created_at"],
} as const;
