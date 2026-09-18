import { stripCnics } from "@/lib/docai/sensitive";

export const EVENT_NAMES = [
  "check_started",
  "check_completed",
  "document_uploaded",
  "report_generated",
  "verification_requested",
  "dealer_used",
  "conversion",
  "feature",
  "drop_off",
] as const;

export type AnalyticsName = (typeof EVENT_NAMES)[number];

export const FEATURES = [
  "voice",
  "token",
  "overseas",
  "offline",
  "whatsapp",
  "plans",
  "guest_check",
  "low_data",
  "accessibility",
] as const;

export type AnalyticsFeature = (typeof FEATURES)[number];

export const CONVERSION_STAGES = ["started", "completed", "report", "premium", "register", "dealer"] as const;
export type ConversionStage = (typeof CONVERSION_STAGES)[number];

export const INTENTS = ["buy", "sell", "rent", "token"] as const;
export type AnalyticsIntent = (typeof INTENTS)[number];

export type AnalyticsEvent = {
  name: AnalyticsName;
  ts: string;
  step?: string;
  feature?: AnalyticsFeature;
  stage?: ConversionStage;
  intent?: AnalyticsIntent;
};

const NAME_SET = new Set<string>(EVENT_NAMES);
const FEATURE_SET = new Set<string>(FEATURES);
const STAGE_SET = new Set<string>(CONVERSION_STAGES);
const INTENT_SET = new Set<string>(INTENTS);
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const STEP_OK = /^[a-z0-9:_-]{1,32}$/i;

function isName(value: string): value is AnalyticsName {
  return NAME_SET.has(value);
}

export function looksPersonal(raw: string): boolean {
  const s = String(raw || "");
  if (EMAIL.test(s)) return true;
  if (/\b\d{13}\b/.test(s) || /\b\d{5}[-\s]\d{7}[-\s]\d\b/.test(s)) return true;
  return false;
}

function cleanStep(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const base = raw.startsWith("doc:") ? `doc:${raw.slice(4).replace(/[^a-z0-9_-]/gi, "").slice(0, 24)}` : raw.startsWith("flag:")
    ? `flag:${raw.slice(5).replace(/[^a-z0-9_-]/gi, "").slice(0, 24)}`
    : raw.startsWith("dd:")
      ? "dd"
      : raw;
  const s = stripCnics(base).slice(0, 32);
  if (!STEP_OK.test(s) || looksPersonal(s)) return undefined;
  return s;
}

/** Keep counts. Drop names, emails, CNICs, notes, GPS, papers. */
export function sanitizeEvent(raw: unknown): AnalyticsEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name : "";
  if (!isName(name)) return null;
  const ts = typeof row.ts === "string" && /^\d{4}-\d{2}-\d{2}T/.test(row.ts) ? row.ts.slice(0, 24) : new Date().toISOString();
  const event: AnalyticsEvent = { name, ts };
  const step = cleanStep(row.step);
  if (step) event.step = step;
  if (typeof row.feature === "string" && FEATURE_SET.has(row.feature)) event.feature = row.feature as AnalyticsFeature;
  if (typeof row.stage === "string" && STAGE_SET.has(row.stage)) event.stage = row.stage as ConversionStage;
  if (typeof row.intent === "string" && INTENT_SET.has(row.intent)) event.intent = row.intent as AnalyticsIntent;
  const blob = JSON.stringify(event);
  if (looksPersonal(blob)) return null;
  return event;
}

export function sanitizeEvents(raw: unknown): AnalyticsEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: AnalyticsEvent[] = [];
  for (const item of raw.slice(0, 20)) {
    const ev = sanitizeEvent(item);
    if (ev) out.push(ev);
  }
  return out;
}

export type AnalyticsSummary = {
  counts: Record<AnalyticsName, number>;
  conversion: Record<ConversionStage, number> & { rate: number };
  features: Record<string, number>;
  dropOff: { step: string; count: number }[];
};

export function emptyCounts(): Record<AnalyticsName, number> {
  return {
    check_started: 0,
    check_completed: 0,
    document_uploaded: 0,
    report_generated: 0,
    verification_requested: 0,
    dealer_used: 0,
    conversion: 0,
    feature: 0,
    drop_off: 0,
  };
}

export function summarizeEvents(events: AnalyticsEvent[]): AnalyticsSummary {
  const counts = emptyCounts();
  const conversion: Record<ConversionStage, number> & { rate: number } = {
    started: 0,
    completed: 0,
    report: 0,
    premium: 0,
    register: 0,
    dealer: 0,
    rate: 0,
  };
  const features: Record<string, number> = {};
  const drop: Record<string, number> = {};

  for (const ev of events) {
    counts[ev.name] += 1;
    if (ev.name === "check_started") conversion.started += 1;
    if (ev.name === "check_completed") conversion.completed += 1;
    if (ev.name === "report_generated") conversion.report += 1;
    if (ev.name === "dealer_used") conversion.dealer += 1;
    if (ev.name === "conversion" && ev.stage) conversion[ev.stage] += 1;
    if (ev.name === "feature" && ev.feature) features[ev.feature] = (features[ev.feature] || 0) + 1;
    if (ev.name === "drop_off") {
      const step = ev.step || "unknown";
      drop[step] = (drop[step] || 0) + 1;
    }
  }
  conversion.rate = conversion.started ? Math.round((conversion.completed / conversion.started) * 100) : 0;
  const dropOff = Object.entries(drop)
    .map(([step, count]) => ({ step, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  return { counts, conversion, features, dropOff };
}
