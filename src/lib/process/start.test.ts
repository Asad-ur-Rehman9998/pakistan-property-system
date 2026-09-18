import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ARCHITECTURE_DOC,
  MVP_IN_TREE,
  PHASE_GATE,
  START_DELIVERABLES,
  START_RULE,
} from "./start";
import { roman } from "@/lib/i18n/dictionary";

const root = process.cwd();

describe("START NOW process", () => {
  it("requires inspect-before-code and all architecture deliverables", () => {
    expect(START_RULE.toLowerCase()).toContain("inspect");
    expect(START_RULE.toLowerCase()).toContain("do not start coding immediately");
    expect(START_DELIVERABLES).toHaveLength(12);
    expect(PHASE_GATE[0]).toBe("Run tests");
    expect(PHASE_GATE).toContain("Check accessibility");
    expect(PHASE_GATE).toContain("Check security");
  });

  it("ships ARCHITECTURE.md covering every deliverable and keeps MVP paths", () => {
    const doc = readFileSync(resolve(root, ARCHITECTURE_DOC), "utf8");
    expect(doc).toContain("START NOW");
    expect(doc.toLowerCase()).toContain("not a portfolio");
    for (const item of START_DELIVERABLES) {
      expect(doc.toLowerCase()).toContain(item.toLowerCase());
    }
    expect(doc).toContain("Database ERD");
    expect(doc).toContain("Phase 2 scope");
    expect(doc).toContain("Phase 3 scope");
    expect(doc).toContain("docs/SCOPE.md");
    expect(doc.toLowerCase()).toContain("look large");
    for (const rel of MVP_IN_TREE) {
      expect(existsSync(resolve(root, rel)), rel).toBe(true);
    }
    expect(roman.how40t.toLowerCase()).toContain("start now");
    expect(roman.how40.toLowerCase()).toContain("inspect");
  });
});
