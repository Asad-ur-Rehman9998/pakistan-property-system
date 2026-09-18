import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  ALLOWED_RUNTIME_DEPS,
  FILE_SOFT_CAPS,
  FORBIDDEN_IN_SOURCE,
  LAYERS,
  QUALITY_RULE,
} from "./rules";
import { loginPayload, registerPayload } from "@/lib/api/authPayload";
import { DEV_SECRET_FALLBACK, sessionSecretFromEnv } from "@/lib/server/env";
import { readFileSync } from "node:fs";

const root = resolve(process.cwd());

describe("code quality contract", () => {
  it("states the product quality rule and maps layers to real paths", () => {
    expect(QUALITY_RULE).toMatch(/SOLID/);
    expect(QUALITY_RULE).toMatch(/DRY/);
    expect(QUALITY_RULE).toMatch(/one component or one file/i);
    expect(FILE_SOFT_CAPS.componentLines).toBeGreaterThan(400);
    expect(FORBIDDEN_IN_SOURCE.length).toBeGreaterThan(2);
    expect(ALLOWED_RUNTIME_DEPS).toContain("zod");
    expect(ALLOWED_RUNTIME_DEPS).not.toContain("@prisma/client");

    for (const paths of Object.values(LAYERS)) {
      for (const rel of paths) {
        expect(existsSync(resolve(root, rel)), rel).toBe(true);
      }
    }
  });

  it("keeps auth payloads shared and typed", () => {
    expect(registerPayload.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
    expect(registerPayload.safeParse({ email: "a@b.co", password: "longenough1" }).success).toBe(true);
    expect(loginPayload.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("refuses a missing session secret in production", () => {
    const prevNode = process.env.NODE_ENV;
    const prevSession = process.env.SESSION_SECRET;
    const prevDjango = process.env.DJANGO_SECRET_KEY;
    try {
      delete process.env.SESSION_SECRET;
      delete process.env.DJANGO_SECRET_KEY;
      process.env.NODE_ENV = "development";
      expect(sessionSecretFromEnv()).toBe(DEV_SECRET_FALLBACK);
      process.env.NODE_ENV = "production";
      expect(() => sessionSecretFromEnv()).toThrow(/SESSION_SECRET/);
    } finally {
      process.env.NODE_ENV = prevNode;
      if (prevSession == null) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = prevSession;
      if (prevDjango == null) delete process.env.DJANGO_SECRET_KEY;
      else process.env.DJANGO_SECRET_KEY = prevDjango;
    }
  });

  it("does not list prisma as a runtime dependency", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.dependencies["@prisma/client"]).toBeUndefined();
    expect(pkg.devDependencies.prisma).toBeUndefined();
  });
});
