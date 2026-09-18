import { describe, expect, it } from "vitest";
import { canShareReports, isRole, professionalUnlocked } from "./roles";

describe("permissions", () => {
  it("knows guest, member, professional, and staff — not a free-for-all admin", () => {
    expect(["guest", "member", "professional", "staff"].every(isRole)).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole("owner")).toBe(false);
  });

  it("lets a guest share a report and locks professional until 2FA", () => {
    expect(canShareReports("guest")).toBe(true);
    expect(canShareReports("member")).toBe(true);
    expect(professionalUnlocked("professional", ["pwd"])).toBe(false);
    expect(professionalUnlocked("professional", ["pwd", "otp"])).toBe(true);
    expect(professionalUnlocked("guest", ["otp"])).toBe(false);
    expect(professionalUnlocked("staff", ["pwd"])).toBe(false);
    expect(professionalUnlocked("staff", ["otp"])).toBe(true);
  });
});
