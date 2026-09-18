import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHITECTURES, FOLDER_ROOTS, PHASES, PROCESS_RULE, QUALITY_PATHS, isSequential, phaseById } from "./phases";

const root = process.cwd();

describe("development process", () => {
  it("forbids dumping thousands of lines before inspect + architecture", () => {
    expect(PROCESS_RULE.toLowerCase()).toContain("do not immediately generate thousands of lines");
    expect(PROCESS_RULE.toLowerCase()).toContain("inspect");
    expect(isSequential()).toBe(true);
    expect(PHASES).toHaveLength(17);
    expect(phaseById(1)?.title.toLowerCase()).toContain("inspect");
    expect(phaseById(2)?.title.toLowerCase()).toContain("architecture");
    expect(ARCHITECTURES).toEqual(["product", "database", "api", "ui", "security", "folders"]);
  });

  it("maps every phase to files that already exist — no second app", () => {
    for (const phase of PHASES) {
      expect(phase.paths.length, `phase ${phase.id}`).toBeGreaterThan(0);
      for (const rel of phase.paths) {
        expect(existsSync(path.join(root, rel)), `${phase.id} ${rel}`).toBe(true);
      }
    }
    for (const dir of FOLDER_ROOTS) {
      expect(existsSync(path.join(root, dir)), dir).toBe(true);
    }
    for (const rel of QUALITY_PATHS) {
      expect(existsSync(path.join(root, rel)), rel).toBe(true);
    }
  });

  it("keeps the written process compact", () => {
    const doc = readFileSync(path.join(root, "docs/DEVELOPMENT.md"), "utf8");
    const lines = doc.split("\n").length;
    expect(lines).toBeLessThan(200);
    expect(doc.toLowerCase()).toContain("do not immediately generate thousands of lines");
    expect(doc).toContain("Product");
    expect(doc).toContain("Database");
    expect(doc).toContain("API");
    expect(doc).toContain("UI");
    expect(doc).toContain("Security");
    expect(doc).toContain("Folder structure");
    expect(doc.toLowerCase()).toContain("guest");
    expect(doc.toLowerCase()).toContain("do not rewrite it onto vite");
    expect(doc.toLowerCase()).toContain("flutter");
  });
});
