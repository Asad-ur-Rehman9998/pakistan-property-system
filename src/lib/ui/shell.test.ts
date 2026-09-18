import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MD_NAV_MIN_WIDTH, UI_VIEWPORTS, usesBottomNav } from "./shell";

const CSS = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

describe("professional shell", () => {
  it("covers 360px, 390px, tablet, laptop, and desktop", () => {
    expect(UI_VIEWPORTS.map((v) => v.width)).toEqual([360, 390, 768, 1280, 1440]);
  });

  it("keeps bottom tabs only below tablet", () => {
    expect(usesBottomNav(360)).toBe(true);
    expect(usesBottomNav(390)).toBe(true);
    expect(usesBottomNav(MD_NAV_MIN_WIDTH)).toBe(false);
    expect(usesBottomNav(1440)).toBe(false);
  });

  it("uses a quiet radius and one green, not candy gradients", () => {
    expect(CSS).toContain("--radius: 0.375rem");
    expect(CSS).toContain("--green: #14532d");
    expect(CSS).not.toMatch(/linear-gradient|radial-gradient|conic-gradient/);
    expect(CSS).toContain("max-width: 36rem");
    expect(CSS).toContain("max-width: 42rem");
    expect(CSS).toContain("max-width: 46rem");
    expect(CSS).toContain("max-width: 48rem");
    expect(CSS).toContain(".shell-wide");
  });
});
