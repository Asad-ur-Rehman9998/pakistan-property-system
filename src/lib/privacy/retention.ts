const KEY = "pehle.retentionDays";

/** 0 = keep until the person deletes. */
export type RetentionDays = 0 | 30 | 90;

export function readRetentionDays(): RetentionDays {
  if (typeof window === "undefined") return 0;
  try {
    const n = Number(window.localStorage.getItem(KEY) || "0");
    if (n === 30 || n === 90) return n;
  } catch {
    /* ignore */
  }
  return 0;
}

export function setRetentionDays(days: RetentionDays) {
  window.localStorage.setItem(KEY, String(days));
}

export function isExpired(createdAt: string, days: RetentionDays, now = Date.now()): boolean {
  if (!days) return false;
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return false;
  return t < now - days * 86_400_000;
}
