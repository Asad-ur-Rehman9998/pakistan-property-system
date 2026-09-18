import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectionLooksSlow } from "./bandwidth";
import { fitSize, pickImageMime } from "./compressImage";
import { enqueueCheck, flushQueue, pendingUploads } from "./queue";
import { checkPhotoKey, DRAFT_PHOTO_PREFIX } from "./photos";
import { makeSavedCheck } from "@/lib/engine/evaluate";
import { examples } from "@/lib/engine/examples";
import { hasDraft, loadDraft, saveDraft } from "@/lib/storage";

beforeEach(() => {
  const store: Record<string, string> = {};
  const ls = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    key: () => null,
    get length() {
      return Object.keys(store).length;
    },
  };
  vi.stubGlobal(
    "window",
    {
      localStorage: ls,
      dispatchEvent: () => true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  );
  vi.stubGlobal("localStorage", ls);
});

describe("low-bandwidth signals", () => {
  it("treats Data Saver and 2G as slow", () => {
    expect(connectionLooksSlow({ saveData: true })).toBe(true);
    expect(connectionLooksSlow({ effectiveType: "2g" })).toBe(true);
    expect(connectionLooksSlow({ effectiveType: "slow-2g" })).toBe(true);
    expect(connectionLooksSlow({ effectiveType: "4g", downlink: 8 })).toBe(false);
  });
});

describe("image fit", () => {
  it("prefers WebP and shrinks the long edge", () => {
    expect(pickImageMime(["image/webp", "image/jpeg"])).toBe("image/webp");
    expect(pickImageMime(["image/jpeg"])).toBe("image/jpeg");
    expect(fitSize(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
    expect(fitSize(4000, 3000, 720)).toEqual({ width: 720, height: 540 });
    expect(fitSize(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });
});

describe("photo keys", () => {
  it("scopes stored papers to a check id, not a shared draft key", () => {
    expect(checkPhotoKey("abc123xyz", 0)).toBe("check-abc123xyz-0");
    expect(checkPhotoKey("abc123xyz", 0).startsWith(DRAFT_PHOTO_PREFIX)).toBe(false);
  });
});

describe("upload queue", () => {
  it("retries a failed share and drops it after success", async () => {
    const saved = makeSavedCheck("queueitem01ab", examples.urban.answers);
    enqueueCheck(saved);
    expect(pendingUploads().some((i) => i.id === saved.id)).toBe(true);

    let calls = 0;
    const fetcher: typeof fetch = async () => {
      calls += 1;
      if (calls === 1) throw new Error("offline");
      return new Response(JSON.stringify({ ok: true, id: saved.id }), { status: 200 });
    };

    const first = await flushQueue(fetcher);
    expect(first.left).toBe(1);
    const second = await flushQueue(fetcher, { force: true });
    expect(second.sent).toBe(1);
    expect(second.left).toBe(0);
    expect(pendingUploads()).toHaveLength(0);
  });

  it("never drops a report after many failed syncs", async () => {
    const saved = makeSavedCheck("queuekeep01ab", examples.urban.answers);
    enqueueCheck(saved);
    const fetcher: typeof fetch = async () => {
      throw new Error("offline");
    };
    for (let i = 0; i < 20; i += 1) {
      const result = await flushQueue(fetcher, { force: true });
      expect(result.left).toBe(1);
      expect(result.sent).toBe(0);
    }
    expect(pendingUploads().some((i) => i.id === saved.id)).toBe(true);
    expect(pendingUploads()[0]?.attempts).toBe(20);
  });
});

describe("local draft storage", () => {
  it("saves property answers on this device", () => {
    expect(saveDraft({ cursor: 3, intent: "buy" })).toBe(true);
    expect(loadDraft(null)).toEqual({ cursor: 3, intent: "buy" });
    expect(hasDraft()).toBe(true);
  });

  it("does not drop the in-memory draft when localStorage refuses the write", () => {
    window.localStorage.setItem = () => {
      throw new Error("quota");
    };
    expect(saveDraft({ cursor: 4, intent: "token" })).toBe(false);
    expect(loadDraft(null)).toEqual({ cursor: 4, intent: "token" });
  });
});
