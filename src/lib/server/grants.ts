import type { Role } from "./roles";
import type { UserRecord } from "./users";
import { STAFF_SCOPES, isStaffGrant, type StaffGrant, type StaffScope } from "@/lib/admin/scopes";

export { STAFF_SCOPES, STAFF_PACKS, isStaffGrant, type StaffGrant, type StaffScope } from "@/lib/admin/scopes";

export function grantsOf(user: Pick<UserRecord, "role" | "grants" | "disabled">): StaffGrant[] {
  if (user.role !== "staff" || user.disabled) return [];
  const raw = (user.grants ?? []).filter(isStaffGrant);
  return [...new Set(raw)];
}

export function effectiveScopes(user: Pick<UserRecord, "role" | "grants" | "disabled">): StaffScope[] {
  const grants = grantsOf(user);
  if (grants.includes("owner")) return [...STAFF_SCOPES];
  return grants.filter((g): g is StaffScope => g !== "owner");
}

export function hasGrant(user: Pick<UserRecord, "role" | "grants" | "disabled">, scope: StaffScope): boolean {
  if (user.role !== "staff" || user.disabled) return false;
  const grants = grantsOf(user);
  return grants.includes("owner") || grants.includes(scope);
}

export function isOwner(user: Pick<UserRecord, "role" | "grants" | "disabled">): boolean {
  return grantsOf(user).includes("owner");
}

export function publicStaffUser(user: UserRecord): {
  id: string;
  email: string;
  role: Role;
  totpEnabled: boolean;
  grants: StaffGrant[];
  disabled: boolean;
  createdAt: string;
} {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    totpEnabled: user.totpEnabled,
    grants: grantsOf(user),
    disabled: Boolean(user.disabled),
    createdAt: user.createdAt,
  };
}

export function ownerBootstrapEmail(): string {
  return String(process.env.STAFF_OWNER_EMAIL || "")
    .trim()
    .toLowerCase();
}
