import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  ENV_EXAMPLE_PATH,
  ENV_KEYS,
  ENV_RULE,
  GITIGNORE_PATH,
  NEVER_COMMIT,
  SECRET_ENV_KEYS,
} from "./catalog";

const root = resolve(process.cwd());

function parseExampleAssignments(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    map.set(key, value);
  }
  return map;
}

describe("environment configuration", () => {
  it("documents the never-commit rule", () => {
    expect(ENV_RULE).toMatch(/\.env\.example/);
    expect(ENV_RULE.toLowerCase()).toMatch(/never commit/);
    for (const item of NEVER_COMMIT) {
      expect(ENV_RULE.toLowerCase()).toContain(item.toLowerCase());
    }
  });

  it("ships .env.example with every known key and empty secrets", () => {
    const path = resolve(root, ENV_EXAMPLE_PATH);
    expect(existsSync(path)).toBe(true);
    const raw = readFileSync(path, "utf8");
    expect(raw.toLowerCase()).toContain("never commit");
    expect(raw).toMatch(/API keys/i);
    expect(raw).toMatch(/passwords/i);
    expect(raw).toMatch(/secret keys/i);
    expect(raw).toMatch(/database credentials/i);
    expect(raw).toMatch(/private tokens/i);

    for (const key of ENV_KEYS) {
      expect(raw.includes(key), key).toBe(true);
    }

    const assigned = parseExampleAssignments(raw);
    for (const key of SECRET_ENV_KEYS) {
      const value = assigned.get(key) ?? "";
      expect(value, `${key} must stay empty in .env.example`).toBe("");
    }
    expect(assigned.get("SESSION_SECRET")).toBe("");
    expect(assigned.get("DJANGO_SECRET_KEY")).toBe("");
    expect(raw).not.toMatch(/sk-proj-|sk-ant-|AKIA[0-9A-Z]{16}/);
  });

  it("gitignores .env and allows only .env.example", () => {
    const ignore = readFileSync(resolve(root, GITIGNORE_PATH), "utf8");
    expect(ignore).toMatch(/^\.env/m);
    expect(ignore).toContain("!.env.example");
    expect(ignore.toLowerCase()).toMatch(/never commit secrets|env files/i);

    const checked = execFileSync("git", ["check-ignore", "-v", ".env"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(checked).toMatch(/\.env/);

    const exampleIgnored = execFileSync("git", ["check-ignore", "-v", ".env.example"], {
      cwd: root,
      encoding: "utf8",
    });
    // Negated patterns still print a matching rule; ensure the last match is the allow.
    expect(exampleIgnored).toContain("!.env.example");
  });
});
