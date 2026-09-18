import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  OFFICIAL_REQUIRED_EN,
  OFFICIAL_SLOT_IDS,
  clearOfficialAdapters,
  lookupOfficial,
  officialLive,
  officialSnapshot,
  registerOfficialAdapter,
} from "./registry";

describe("official integrations", () => {
  it("keeps every government slot unavailable and never invents a record", () => {
    const snap = officialSnapshot();
    expect(snap.anyLive).toBe(false);
    expect(snap.hasOfficialVerification).toBe(false);
    expect(snap.slots.map((s) => s.id)).toEqual([...OFFICIAL_SLOT_IDS]);
    for (const slot of snap.slots) {
      expect(slot.available).toBe(false);
      expect(slot.required).toBe(true);
      expect(slot.message).toBe(OFFICIAL_REQUIRED_EN);
      const hit = lookupOfficial(slot.id, { khasra: "123", plot: "412", cnic: "35202" });
      expect(hit.available).toBe(false);
      expect(hit.invented).toBe(false);
      expect(hit.record).toBeNull();
      expect(hit.message).toBe("Official verification required.");
    }
  });

  it("does not treat a registered adapter as live verification of a property", () => {
    clearOfficialAdapters();
    registerOfficialAdapter({ id: "fard", isLive: () => false });
    expect(officialLive()).toBe(false);
    expect(lookupOfficial("fard").record).toBeNull();
    expect(officialSnapshot().hasOfficialVerification).toBe(false);
    clearOfficialAdapters();
  });

  it("does not ship fake land-record, fard, registry, mutation, or NOC APIs", () => {
    const apiRoot = path.join(process.cwd(), "src/app/api");
    const forbidden = ["fard", "registry", "mutation", "noc", "land", "plra", "arazi", "gov", "government"];
    const names = readdirSync(apiRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    for (const name of forbidden) {
      expect(names, name).not.toContain(name);
    }
    expect(existsSync(path.join(apiRoot, "official", "fard"))).toBe(false);
    expect(existsSync(path.join(apiRoot, "official", "lookup"))).toBe(false);
    const status = readFileSync(path.join(apiRoot, "official", "status", "route.ts"), "utf8");
    expect(status).toContain("Official verification required.");
    expect(status).not.toMatch(/ownerName|fakeFard|sampleRecord|khasra.*=/);
  });
});
