/** One grant = one admin desk. Owner is the only key that unlocks every desk. */
export const STAFF_SCOPES = [
  "users",
  "dealers",
  "properties",
  "reports",
  "documents",
  "verify",
  "flags",
  "duplicates",
  "billing",
  "complaints",
  "audit",
  "analytics",
  "ai",
  "health",
] as const;

export type StaffScope = (typeof STAFF_SCOPES)[number];
export type StaffGrant = StaffScope | "owner";

export const STAFF_PACKS: Record<string, StaffGrant[]> = {
  owner: ["owner"],
  support: ["users", "complaints", "reports"],
  ops: ["dealers", "properties", "reports", "documents", "verify", "flags", "duplicates"],
  finance: ["billing"],
  security: ["users", "audit", "analytics", "health"],
};

export function isStaffGrant(value: string): value is StaffGrant {
  return value === "owner" || (STAFF_SCOPES as readonly string[]).includes(value);
}
