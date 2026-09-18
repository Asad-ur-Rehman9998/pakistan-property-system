import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FORBIDDEN_COLUMNS, POSTGRES_TABLES } from "./schema";

const MODELS = readFileSync(path.join(process.cwd(), "api/checks/models.py"), "utf8");

describe("postgres schema contract", () => {
  it("declares every requested table", () => {
    for (const table of POSTGRES_TABLES) {
      expect(MODELS).toContain(`db_table = "${table}"`);
    }
  });

  it("uses UUID primary keys on normalized models", () => {
    expect(MODELS).toContain("UUIDField(primary_key=True");
    expect(MODELS.match(/class \w+\(UuidModel\)/g)?.length).toBe(POSTGRES_TABLES.length);
  });

  it("does not store papers or extra secrets", () => {
    expect(MODELS).not.toMatch(/\b(FileField|ImageField|BinaryField)\b/);
    for (const col of FORBIDDEN_COLUMNS) {
      expect(MODELS, col).not.toMatch(new RegExp(`\\b${col}\\s*=`));
    }
    expect(MODELS).toContain("password_hash");
    expect(MODELS).toContain("share_token_hash");
    expect(MODELS).toContain("phone_last4");
    expect(MODELS).toContain("extraction_cnic_last4_only");
  });

  it("keeps listings private and verification unofficial by default", () => {
    expect(MODELS).toContain('kind = models.CharField(max_length=16, default="source_card")');
    expect(MODELS).toContain("is_public = models.BooleanField(default=False)");
    expect(MODELS).toContain("has_official_verification = models.BooleanField(default=False)");
    expect(MODELS).toContain("provenance_verified = models.PositiveSmallIntegerField(default=0)");
    expect(MODELS).toContain("processor = models.BooleanField(default=False)");
  });
});
