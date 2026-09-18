import { describe, expect, it } from "vitest";
import { OFFLINE_STAGE_IDS, resolveSyncPhase } from "./architecture";

describe("offline-first architecture", () => {
  it("follows fill → local save → offline → saved on device → net returns → sync", () => {
    expect([...OFFLINE_STAGE_IDS]).toEqual([
      "fill_property",
      "saved_locally",
      "internet_unavailable",
      "saved_on_device",
      "internet_returns",
      "sync",
    ]);
  });

  it("keeps a saved-on-device label while the net is down", () => {
    expect(resolveSyncPhase({ online: false, queued: 0 })).toBe("internet_unavailable");
    expect(resolveSyncPhase({ online: false, queued: 2 })).toBe("internet_unavailable");
  });

  it("shows waiting or failed while a report is queued, never pretends it synced", () => {
    expect(resolveSyncPhase({ online: true, queued: 1 })).toBe("waiting");
    expect(resolveSyncPhase({ online: true, queued: 1, lastError: "offline" })).toBe("failed");
    expect(resolveSyncPhase({ online: true, queued: 1, syncing: true })).toBe("syncing");
  });

  it("returns to saved-on-device after a successful sync", () => {
    expect(resolveSyncPhase({ online: true, queued: 0, justSynced: true })).toBe("synced");
    expect(resolveSyncPhase({ online: true, queued: 0 })).toBe("saved_on_device");
  });
});
