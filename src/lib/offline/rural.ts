import type { Lang } from "@/types/check";

/** Cheap-phone photo budget when rural / low-bandwidth is on. */
export const RURAL_COMPRESS = { maxBytes: 80_000, maxEdge: 720 } as const;
export const DEFAULT_COMPRESS = { maxBytes: 180_000, maxEdge: 1280 } as const;

/** Rural UI prefers Urdu or Roman Urdu. English is switched to Roman, not forced over Urdu. */
export function preferredRuralLang(lang: Lang): Lang {
  return lang === "en" ? "roman" : lang;
}
