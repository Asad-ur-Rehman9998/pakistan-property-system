import type { Localized } from "@/types/check";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

/** Slots a real official source may later fill. None are live today. */
export const OFFICIAL_SLOT_IDS = [
  "land_records",
  "fard",
  "registry",
  "mutation",
  "noc",
  "government_db",
] as const;

export type OfficialSlotId = (typeof OFFICIAL_SLOT_IDS)[number];

export const OFFICIAL_REQUIRED_EN = "Official verification required.";

export const OFFICIAL_SLOT_LABEL: Record<OfficialSlotId, Localized> = {
  land_records: L("Land records", "لینڈ ریکارڈ", "Land record"),
  fard: L("Fard", "فرد", "Fard"),
  registry: L("Registry", "رجسٹری", "Registry"),
  mutation: L("Mutation / intiqal", "انتقال", "Intiqal / mutation"),
  noc: L("NOC", "این او سی", "NOC"),
  government_db: L("Government databases", "سرکاری ڈیٹا بیس", "Sarkari database"),
};

export type OfficialLookupResult = {
  available: false;
  required: true;
  invented: false;
  message: typeof OFFICIAL_REQUIRED_EN;
  record: null;
};

export type OfficialSlotStatus = {
  id: OfficialSlotId;
  available: false;
  required: true;
  message: typeof OFFICIAL_REQUIRED_EN;
};

export type OfficialSnapshot = {
  anyLive: false;
  hasOfficialVerification: false;
  slots: OfficialSlotStatus[];
};

/**
 * Later: register a real adapter that talks to an official source.
 * Do not register a stub that invents fard, registry, mutation, NOC, or land-record data.
 */
export interface OfficialAdapter {
  id: OfficialSlotId;
  isLive(): boolean;
}

const adapters = new Map<OfficialSlotId, OfficialAdapter>();

export function registerOfficialAdapter(adapter: OfficialAdapter): void {
  if (!adapter.isLive()) return;
  adapters.set(adapter.id, adapter);
}

export function clearOfficialAdapters(): void {
  adapters.clear();
}

export function lookupOfficial(_slot: OfficialSlotId, _query?: Record<string, string>): OfficialLookupResult {
  return {
    available: false,
    required: true,
    invented: false,
    message: OFFICIAL_REQUIRED_EN,
    record: null,
  };
}

export function officialSnapshot(): OfficialSnapshot {
  const slots: OfficialSlotStatus[] = OFFICIAL_SLOT_IDS.map((id) => ({
    id,
    available: false,
    required: true,
    message: OFFICIAL_REQUIRED_EN,
  }));
  return {
    anyLive: false,
    hasOfficialVerification: false,
    slots,
  };
}

export function officialLive(): boolean {
  return [...adapters.values()].some((a) => a.isLive());
}
