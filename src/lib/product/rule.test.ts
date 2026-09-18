import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { en, roman } from "@/lib/i18n/dictionary";
import {
  FEATURE_FILTER_QUESTION,
  FEATURE_OUTCOMES,
  MOST_IMPORTANT_RULE,
  SCOPE_DOC,
  shouldBuildFeature,
} from "./rule";

const root = process.cwd();

describe("most important product rule", () => {
  it("forbids random features that only make the app look large", () => {
    expect(MOST_IMPORTANT_RULE.toLowerCase()).toContain("do not add random features");
    expect(MOST_IMPORTANT_RULE.toLowerCase()).toContain("look large");
    expect(FEATURE_FILTER_QUESTION).toMatch(/safer/);
    expect(FEATURE_FILTER_QUESTION).toMatch(/easier/);
    expect(FEATURE_FILTER_QUESTION).toMatch(/clearer/);
    expect(FEATURE_FILTER_QUESTION).toMatch(/more accessible/);
    expect(FEATURE_FILTER_QUESTION).toMatch(/Pakistan/);
    expect(FEATURE_OUTCOMES).toEqual(["safer", "easier", "clearer", "more accessible"]);
  });

  it("builds only when at least one outcome applies", () => {
    expect(shouldBuildFeature([])).toBe(false);
    expect(shouldBuildFeature(["safer"])).toBe(true);
    expect(shouldBuildFeature(["easier", "clearer"])).toBe(true);
    expect(shouldBuildFeature(["more accessible"])).toBe(true);
  });

  it("documents the rule and keeps how copy aligned", () => {
    const docPath = resolve(root, SCOPE_DOC);
    expect(existsSync(docPath)).toBe(true);
    const doc = readFileSync(docPath, "utf8");
    expect(doc).toContain(MOST_IMPORTANT_RULE);
    expect(doc).toContain(FEATURE_FILTER_QUESTION);
    expect(doc.toLowerCase()).toContain("if **no**");
    expect(doc.toLowerCase()).toContain("do not build");

    expect(en.how39t.toLowerCase()).toContain("most important");
    expect(roman.how39).toContain("safer");
    expect(roman.how39).toContain("easier");
    expect(roman.how39).toContain("clearer");
    expect(roman.how39.toLowerCase()).toContain("accessible");
    expect(roman.how39.toLowerCase()).toContain("do not build");
  });
});
