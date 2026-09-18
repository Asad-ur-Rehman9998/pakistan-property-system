import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { E2E, INTEGRATION, RUN, UNIT } from "./matrix";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("test matrix", () => {
  it("points unit, integration, and e2e at files that exist", () => {
    const files = [
      ...Object.values(UNIT).flat(),
      ...Object.values(INTEGRATION).flat(),
      E2E.customer.script,
      E2E.dealer.script,
      RUN.ci,
      "docs/TESTING.md",
    ];
    for (const rel of files) {
      expect(existsSync(path.join(root, rel)), rel).toBe(true);
    }
  });

  it("keeps the two e2e journeys in the UI script", () => {
    const script = read(E2E.customer.script);
    expect(E2E.customer.steps).toEqual(["Check Property", "Upload Document", "Review Information", "Generate Report"]);
    expect(E2E.dealer.steps).toEqual(["Add Property", "Upload Documents", "Generate Report", "Share with Customer"]);
    expect(script).toContain("Apni property ki dastavez upload karein");
    expect(script).toContain("Phone ne kya padha, check karein");
    expect(script).toContain("Maloomati pages banayein");
    expect(script).toContain("Due-diligence report banayein");
    expect(script).toContain("Page WhatsApp par bhejein");
    expect(script).toContain("input[type=\"file\"]");
  });
});
