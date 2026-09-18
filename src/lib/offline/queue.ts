import type { SavedCheck } from "@/types/check";
import { sanitizeCheckForShare } from "@/lib/docai/sanitize";

const KEY = "pehle.uploadQueue";
const EVENT = "pehle-queue";

export interface QueueItem {
  id: string;
  url: string;
  body: string;
  attempts: number;
  nextAt: number;
  lastError?: string;
}

let flushing = false;
let lastFlushError: string | null = null;
let lastSuccessfulSyncAt = 0;

function load(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as QueueItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: QueueItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota — items stay in this process via the next load() if write succeeded earlier */
  }
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* tests without Event */
  }
}

export function pendingUploads(): QueueItem[] {
  return load();
}

export function isFlushing(): boolean {
  return flushing;
}

export function lastQueueError(): string | null {
  return lastFlushError;
}

export function lastSuccessfulSyncAtMs(): number {
  return lastSuccessfulSyncAt;
}

export function clearQueue() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  lastFlushError = null;
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function enqueueCheck(saved: SavedCheck) {
  if (typeof window === "undefined") return;
  const items = load().filter((i) => i.id !== saved.id);
  items.push({
    id: saved.id,
    url: "/api/checks",
    body: JSON.stringify(sanitizeCheckForShare(saved)),
    attempts: 0,
    nextAt: 0,
  });
  save(items);
}

export async function flushQueue(
  fetcher: typeof fetch = fetch,
  opts?: { force?: boolean },
): Promise<{ sent: number; left: number; error: string | null }> {
  if (typeof window === "undefined") return { sent: 0, left: 0, error: null };
  if (typeof navigator !== "undefined" && navigator.onLine === false && !opts?.force) {
    return { sent: 0, left: load().length, error: lastFlushError };
  }
  if (flushing) return { sent: 0, left: load().length, error: lastFlushError };
  flushing = true;
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
  const now = Date.now();
  const kept: QueueItem[] = [];
  let sent = 0;
  let error: string | null = null;
  try {
    for (const item of load()) {
      if (!opts?.force && item.nextAt > now) {
        kept.push(item);
        continue;
      }
      try {
        const res = await fetcher(item.url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: item.body,
        });
        if (!res.ok && res.status !== 409) throw new Error(`http_${res.status}`);
        sent += 1;
      } catch (err) {
        const attempts = item.attempts + 1;
        error = err instanceof Error ? err.message : "sync_failed";
        kept.push({
          ...item,
          attempts,
          lastError: error,
          nextAt: now + Math.min(15 * 60_000, 1500 * 2 ** Math.min(attempts, 8)),
        });
      }
    }
    save(kept);
    if (sent > 0 && kept.length === 0) lastSuccessfulSyncAt = Date.now();
    lastFlushError = kept.length ? error : null;
    return { sent, left: kept.length, error: lastFlushError };
  } finally {
    flushing = false;
    try {
      window.dispatchEvent(new Event(EVENT));
    } catch {
      /* ignore */
    }
  }
}

export function subscribeQueue(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
