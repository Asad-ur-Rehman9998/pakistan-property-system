import type { CheckAnswers } from "@/types/check";
import type { DealerFollowUp, DealerImportRow, DealerPage, DealerPerson, DealerVisit } from "@/types/dealer";
import { emptyAnswers } from "@/types/check";
import { newCheckId } from "@/lib/id";

const KEY = "pehle.dealerPages";
const EVENT = "pehle-dealer";

let cacheRaw: string | null | undefined;
let cache: DealerPage[] = [];

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function loadDealerPages(): DealerPage[] {
  if (typeof window === "undefined") return [];
  const raw = readRaw();
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as DealerPage[]) : [];
    cache = Array.isArray(parsed) ? parsed.map(normalizePage) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function normalizePage(p: DealerPage): DealerPage {
  return {
    id: p.id,
    createdAt: p.createdAt || new Date().toISOString(),
    checkId: p.checkId ?? null,
    city: p.city || "",
    area: p.area || "",
    plotNumber: p.plotNumber || "",
    khasraNumber: p.khasraNumber || "",
    areaSize: p.areaSize || "",
    areaUnit: p.areaUnit ?? null,
    price: p.price || "",
    notes: p.notes || "",
    people: Array.isArray(p.people) ? p.people : [],
    visits: Array.isArray(p.visits) ? p.visits : [],
    followUps: Array.isArray(p.followUps) ? p.followUps : [],
  };
}

function persist(pages: DealerPage[]) {
  const next = pages.slice(0, 40);
  const raw = JSON.stringify(next);
  window.localStorage.setItem(KEY, raw);
  cacheRaw = raw;
  cache = next;
  window.dispatchEvent(new Event(EVENT));
}

export function emptyDealerPage(partial?: Partial<DealerPage>): DealerPage {
  return {
    id: newCheckId(),
    createdAt: new Date().toISOString(),
    checkId: null,
    city: "",
    area: "",
    plotNumber: "",
    khasraNumber: "",
    areaSize: "",
    areaUnit: null,
    price: "",
    notes: "",
    people: [],
    visits: [],
    followUps: [],
    ...partial,
  };
}

export function pageFromImport(row: DealerImportRow): DealerPage {
  return emptyDealerPage({
    city: row.city,
    area: row.area,
    plotNumber: row.plotNumber,
    khasraNumber: row.khasraNumber,
    areaSize: row.areaSize,
    areaUnit: row.areaUnit,
    price: row.price,
  });
}

export function getDealerPage(id: string): DealerPage | null {
  return loadDealerPages().find((p) => p.id === id) ?? null;
}

export function saveDealerPage(page: DealerPage) {
  const all = loadDealerPages().filter((p) => p.id !== page.id);
  all.unshift(normalizePage(page));
  persist(all);
}

export function saveDealerPages(pages: DealerPage[]) {
  persist(pages.map(normalizePage));
}

export function clearDealerPages() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  cacheRaw = null;
  cache = [];
  window.dispatchEvent(new Event(EVENT));
}

export function attachCheckToDealerPage(pageId: string, checkId: string): DealerPage | null {
  const page = getDealerPage(pageId);
  if (!page) return null;
  const next = { ...page, checkId };
  saveDealerPage(next);
  return next;
}

export function answersFromDealerPage(page: DealerPage): CheckAnswers {
  return {
    ...emptyAnswers(),
    intent: "sell",
    city: page.city,
    area: page.area,
    societyName: page.area,
    locationLabel: [page.area, page.city].filter(Boolean).join(", "),
    plotNumber: page.plotNumber,
    khasraNumber: page.khasraNumber,
    areaSize: page.areaSize,
    areaUnit: page.areaUnit,
    price: page.price,
    foundVia: "dealer",
    notes: page.notes,
  };
}

export function createPageFromCheckId(
  checkId: string,
  answers: {
    city?: string;
    area?: string;
    plotNumber?: string;
    khasraNumber?: string;
    areaSize?: string;
    areaUnit?: DealerPage["areaUnit"];
    price?: string;
  },
): DealerPage {
  const page = emptyDealerPage({
    checkId,
    city: answers.city || "",
    area: answers.area || "",
    plotNumber: answers.plotNumber || "",
    khasraNumber: answers.khasraNumber || "",
    areaSize: answers.areaSize || "",
    areaUnit: answers.areaUnit ?? null,
    price: answers.price || "",
  });
  saveDealerPage(page);
  return page;
}

export function addPerson(page: DealerPage, person: Omit<DealerPerson, "id">): DealerPage {
  const next = { ...page, people: [{ ...person, id: newCheckId() }, ...page.people].slice(0, 20) };
  saveDealerPage(next);
  return next;
}

export function addVisit(page: DealerPage, visit: Omit<DealerVisit, "id">): DealerPage {
  const next = { ...page, visits: [{ ...visit, id: newCheckId() }, ...page.visits].slice(0, 20) };
  saveDealerPage(next);
  return next;
}

export function addFollowUp(page: DealerPage, item: Omit<DealerFollowUp, "id">): DealerPage {
  const next = { ...page, followUps: [{ ...item, id: newCheckId() }, ...page.followUps].slice(0, 20) };
  saveDealerPage(next);
  return next;
}

export function subscribeDealerPages(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}
