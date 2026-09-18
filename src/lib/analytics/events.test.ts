import { describe, expect, it } from "vitest";
import { sanitizeEvent, sanitizeEvents, summarizeEvents, looksPersonal } from "./events";

describe("privacy-conscious analytics", () => {
  it("keeps allowlisted counts and drops personal fields", () => {
    const ok = sanitizeEvent({
      name: "check_started",
      ts: "2026-08-31T07:00:00.000Z",
      intent: "buy",
      email: "user@example.test",
      notes: "3520212345671",
    });
    expect(ok).toEqual({ name: "check_started", ts: "2026-08-31T07:00:00.000Z", intent: "buy" });
    expect(JSON.stringify(ok)).not.toMatch(/example\.test|3520212345671/);
  });

  it("rejects emails, CNICs, and unknown event names", () => {
    expect(looksPersonal("owner@gmail.com")).toBe(true);
    expect(looksPersonal("3520212345671")).toBe(true);
    expect(looksPersonal("upload")).toBe(false);
    expect(sanitizeEvent({ name: "pageview", ts: "2026-08-31T07:00:00.000Z" })).toBeNull();
    expect(sanitizeEvent({ name: "drop_off", ts: "2026-08-31T07:00:00.000Z", step: "user@x.com" })).toEqual({
      name: "drop_off",
      ts: "2026-08-31T07:00:00.000Z",
    });
    expect(sanitizeEvents([{ name: "check_completed", ts: "2026-08-31T07:00:00.000Z" }, { name: "hack" }])).toHaveLength(1);
  });

  it("summarizes funnel, features, and drop-off points", () => {
    const summary = summarizeEvents([
      { name: "check_started", ts: "t" },
      { name: "check_started", ts: "t" },
      { name: "check_completed", ts: "t" },
      { name: "document_uploaded", ts: "t" },
      { name: "report_generated", ts: "t" },
      { name: "verification_requested", ts: "t" },
      { name: "dealer_used", ts: "t" },
      { name: "conversion", ts: "t", stage: "premium" },
      { name: "feature", ts: "t", feature: "voice" },
      { name: "feature", ts: "t", feature: "voice" },
      { name: "drop_off", ts: "t", step: "upload" },
      { name: "drop_off", ts: "t", step: "upload" },
      { name: "drop_off", ts: "t", step: "price" },
    ]);
    expect(summary.counts.check_started).toBe(2);
    expect(summary.counts.check_completed).toBe(1);
    expect(summary.counts.document_uploaded).toBe(1);
    expect(summary.counts.report_generated).toBe(1);
    expect(summary.counts.verification_requested).toBe(1);
    expect(summary.counts.dealer_used).toBe(1);
    expect(summary.conversion.rate).toBe(50);
    expect(summary.conversion.premium).toBe(1);
    expect(summary.features.voice).toBe(2);
    expect(summary.dropOff[0]).toEqual({ step: "upload", count: 2 });
  });
});
