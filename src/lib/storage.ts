import type { SavedCheck } from "@/types/check";

const LIST = "pehle.checks";
const DRAFT = "pehle.draft";
const CHECKS_EVENT = "pehle-checks";
const DRAFT_EVENT = "pehle-draft";

let checksCacheRaw: string | null | undefined;
let checksCache: SavedCheck[] = [];
let draftCacheRaw: string | null | undefined;
let draftCache: unknown = null;

function emit(name: string) {
  try {
    window.dispatchEvent(new Event(name));
  } catch {
    /* tests without EventTarget */
  }
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, raw: string): boolean {
  try {
    window.localStorage.setItem(key, raw);
    return true;
  } catch {
    return false;
  }
}

function removeRaw(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function loadChecks(): SavedCheck[] {
  if (typeof window === "undefined") return [];
  const raw = readRaw(LIST);
  if (raw === checksCacheRaw) return checksCache;
  checksCacheRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as SavedCheck[]) : [];
    checksCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    checksCache = checksCacheRaw === raw && checksCache.length ? checksCache : [];
  }
  return checksCache;
}

export function replaceChecks(all: SavedCheck[]): boolean {
  const next = all.slice(0, 40);
  let raw = "";
  try {
    raw = JSON.stringify(next);
  } catch {
    return false;
  }
  const ok = typeof window === "undefined" ? false : writeRaw(LIST, raw);
  checksCacheRaw = ok ? raw : checksCacheRaw;
  checksCache = next;
  emit(CHECKS_EVENT);
  return ok;
}

export function saveCheck(check: SavedCheck): boolean {
  const all = loadChecks().filter((c) => c.id !== check.id);
  all.unshift(check);
  return replaceChecks(all);
}

export function deleteCheck(id: string): boolean {
  return replaceChecks(loadChecks().filter((c) => c.id !== id));
}

export function clearAllChecks() {
  removeRaw(LIST);
  removeRaw(DRAFT);
  checksCacheRaw = null;
  checksCache = [];
  draftCacheRaw = null;
  draftCache = null;
  emit(CHECKS_EVENT);
  emit(DRAFT_EVENT);
}

export function getCheck(id: string): SavedCheck | null {
  return loadChecks().find((c) => c.id === id) ?? null;
}

export function saveDraft(data: unknown): boolean {
  draftCache = data;
  let raw = "";
  try {
    raw = JSON.stringify(data);
  } catch {
    emit(DRAFT_EVENT);
    return false;
  }
  const ok = typeof window === "undefined" ? false : writeRaw(DRAFT, raw);
  if (ok) draftCacheRaw = raw;
  emit(DRAFT_EVENT);
  return ok;
}

export function loadDraft<T>(fallback: T): T {
  if (typeof window === "undefined") return (draftCache as T) ?? fallback;
  const raw = readRaw(DRAFT);
  if (raw === draftCacheRaw) return (draftCache as T) ?? fallback;
  draftCacheRaw = raw;
  try {
    draftCache = raw ? JSON.parse(raw) : draftCache;
  } catch {
    /* keep in-memory draft rather than wiping it */
  }
  return (draftCache as T) ?? fallback;
}

export function hasDraft(): boolean {
  return loadDraft<unknown>(null) != null;
}

export function clearDraft() {
  removeRaw(DRAFT);
  draftCacheRaw = null;
  draftCache = null;
  emit(DRAFT_EVENT);
}

export function subscribeChecks(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHECKS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHECKS_EVENT, onChange);
  };
}

export function subscribeDraft(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(DRAFT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(DRAFT_EVENT, onChange);
  };
}
