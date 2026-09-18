import { describe, expect, it } from "vitest";
import { effectiveScopes, grantsOf, hasGrant, isOwner, publicStaffUser } from "./grants";
import { STAFF_PACKS, STAFF_SCOPES } from "@/lib/admin/scopes";
import type { UserRecord } from "./users";

function staff(grants: UserRecord["grants"], extra?: Partial<UserRecord>): UserRecord {
  return {
    id: "staffuser01",
    email: "a@example.test",
    password: "x",
    role: "staff",
    totpEnabled: true,
    createdAt: "2026-08-28T00:00:00.000Z",
    grants,
    ...extra,
  };
}

describe("staff grants", () => {
  it("gives owner every desk and others only their pack", () => {
    const owner = staff(["owner"]);
    expect(isOwner(owner)).toBe(true);
    expect(effectiveScopes(owner)).toEqual([...STAFF_SCOPES]);
    expect(hasGrant(owner, "billing")).toBe(true);
    expect(hasGrant(owner, "audit")).toBe(true);
    expect(hasGrant(owner, "analytics")).toBe(true);

    const support = staff(STAFF_PACKS.support);
    expect(isOwner(support)).toBe(false);
    expect(hasGrant(support, "users")).toBe(true);
    expect(hasGrant(support, "complaints")).toBe(true);
    expect(hasGrant(support, "reports")).toBe(true);
    expect(hasGrant(support, "billing")).toBe(false);
    expect(hasGrant(support, "audit")).toBe(false);
    expect(hasGrant(support, "analytics")).toBe(false);
    expect(hasGrant(support, "health")).toBe(false);
    expect(effectiveScopes(support)).toEqual(["users", "complaints", "reports"]);

    const finance = staff(STAFF_PACKS.finance);
    expect(hasGrant(finance, "billing")).toBe(true);
    expect(hasGrant(finance, "users")).toBe(false);

    const ops = staff(STAFF_PACKS.ops);
    expect(hasGrant(ops, "flags")).toBe(true);
    expect(hasGrant(ops, "duplicates")).toBe(true);
    expect(hasGrant(ops, "users")).toBe(false);
    expect(hasGrant(ops, "billing")).toBe(false);
  });

  it("revokes every desk when the account is disabled", () => {
    const user = staff(["owner"], { disabled: true });
    expect(grantsOf(user)).toEqual([]);
    expect(hasGrant(user, "users")).toBe(false);
    expect(publicStaffUser(user).disabled).toBe(true);
  });

  it("does not treat a professional as staff", () => {
    const pro = staff(["owner"], { role: "professional" });
    expect(hasGrant(pro, "users")).toBe(false);
    expect(effectiveScopes(pro)).toEqual([]);
  });
});
