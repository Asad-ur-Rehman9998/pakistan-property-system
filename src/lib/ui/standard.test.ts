import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { en, roman } from "@/lib/i18n/dictionary";
import { UI_VIEWPORTS } from "./shell";
import {
  FORBIDDEN_PRODUCT_LOOKS,
  PRESENTATION_AUDIENCES,
  PRODUCT_CSS,
  PRODUCT_DOC,
  PRODUCT_LOOK,
  PRODUCT_SHELL,
  PRODUCT_STANDARD,
} from "./standard";

const root = process.cwd();

describe("final product standard", () => {
  it("states who the product must be presentable to", () => {
    expect(PRODUCT_STANDARD).toMatch(/Pakistani property dealers/);
    expect(PRODUCT_STANDARD.toLowerCase()).toMatch(/overseas pakistanis/);
    expect(PRODUCT_STANDARD.toLowerCase()).toMatch(/student crud/);
    expect(PRODUCT_STANDARD.toLowerCase()).toMatch(/ai-generated dashboard/);
    expect(PRESENTATION_AUDIENCES).toHaveLength(8);
    expect(FORBIDDEN_PRODUCT_LOOKS).toEqual([
      "student CRUD project",
      "generic AI-generated dashboard",
    ]);
  });

  it("keeps a quiet financial look — not candy UI or a fifth home CTA", () => {
    expect(PRODUCT_LOOK.homeCtas).toEqual(["check", "token", "dealer", "understand"]);
    expect(PRODUCT_LOOK.homePaths).toEqual(["/check", "/token", "/dealer", "/how"]);
    expect(PRODUCT_LOOK.oneGreen).toBe("#14532d");
    expect(UI_VIEWPORTS.map((v) => v.width)).toEqual([360, 390, 768, 1280, 1440]);

    const css = readFileSync(resolve(root, PRODUCT_CSS), "utf8");
    expect(css).toContain(`--green: ${PRODUCT_LOOK.oneGreen}`);
    expect(css).toContain(`--radius: ${PRODUCT_LOOK.radius}`);
    expect(css).not.toMatch(/linear-gradient|radial-gradient|conic-gradient/);

    const home = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
    for (const path of PRODUCT_LOOK.homePaths) {
      expect(home).toContain(`href="${path}"`);
    }
    expect(home.match(/btn-primary|btn-ghost/g)?.length).toBe(4);
  });

  it("documents the standard and keeps how copy aligned", () => {
    for (const rel of [PRODUCT_DOC, PRODUCT_SHELL, PRODUCT_CSS]) {
      expect(existsSync(resolve(root, rel)), rel).toBe(true);
    }
    const doc = readFileSync(resolve(root, PRODUCT_DOC), "utf8");
    expect(doc).toContain("FINAL PRODUCT STANDARD");
    for (const audience of PRESENTATION_AUDIENCES) {
      expect(doc).toContain(audience);
    }
    for (const bad of FORBIDDEN_PRODUCT_LOOKS) {
      expect(doc.toLowerCase()).toContain(bad.toLowerCase());
    }
    expect(en.how24t).toContain("Serious UI");
    expect(en.how24.toLowerCase()).toContain("overloaded dashboard");
    expect(roman.how38t.toLowerCase()).toContain("final product");
    expect(roman.how38.toLowerCase()).toContain("student crud");
    expect(roman.how38.toLowerCase()).toContain("ai-generated dashboard");
  });
});
