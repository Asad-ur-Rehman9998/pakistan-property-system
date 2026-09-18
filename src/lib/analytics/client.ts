import type { AnalyticsEvent, AnalyticsFeature, AnalyticsIntent, AnalyticsName, ConversionStage } from "./events";

const KEY = "pehle.analytics";
const MAX_QUEUE = 80;

type Queued = AnalyticsEvent;

function load(): Queued[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "[]") as Queued[];
    return Array.isArray(parsed) ? parsed.slice(-MAX_QUEUE) : [];
  } catch {
    return [];
  }
}

function save(items: Queued[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_QUEUE)));
  } catch {
    /* quota */
  }
}

export function clearAnalyticsQueue() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function track(
  name: AnalyticsName,
  extra?: { step?: string; feature?: AnalyticsFeature; stage?: ConversionStage; intent?: AnalyticsIntent | null },
) {
  if (typeof window === "undefined") return;
  const event: AnalyticsEvent = { name, ts: new Date().toISOString() };
  if (extra?.step) event.step = extra.step;
  if (extra?.feature) event.feature = extra.feature;
  if (extra?.stage) event.stage = extra.stage;
  if (extra?.intent === "buy" || extra?.intent === "sell" || extra?.intent === "rent" || extra?.intent === "token") {
    event.intent = extra.intent;
  }
  const next = [...load(), event];
  save(next);
  if (next.length >= 5) void flushAnalytics();
}

let flushing = false;

export async function flushAnalytics(send: typeof fetch = fetch): Promise<void> {
  if (typeof window === "undefined" || flushing) return;
  const items = load();
  if (!items.length) return;
  flushing = true;
  try {
    const batch = items.slice(0, 20);
    const res = await send("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: batch }),
    });
    if (res.ok) save(load().slice(batch.length));
  } catch {
    /* stay queued */
  } finally {
    flushing = false;
  }
}
