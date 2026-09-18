import type { AreaUnit, Intent, PropertyKind } from "@/types/check";

export type VoiceSeed = {
  intent?: Intent;
  kind?: PropertyKind;
  size?: string;
  unit?: AreaUnit;
  abroad?: boolean;
};

const KINDS: PropertyKind[] = ["house", "plot", "flat", "shop", "agri", "industrial", "file"];
const UNITS: AreaUnit[] = ["marla", "kanal", "sqyd", "sqft", "acre"];
const INTENTS: Intent[] = ["buy", "sell", "rent", "token"];

export function voiceSeedFromSearch(sp: { get: (k: string) => string | null }): VoiceSeed | null {
  if (sp.get("from") !== "voice") return null;
  const intentRaw = sp.get("intent");
  const kindRaw = sp.get("kind");
  const unitRaw = sp.get("unit");
  const size = (sp.get("size") || "").trim();
  const intent = INTENTS.includes(intentRaw as Intent) ? (intentRaw as Intent) : undefined;
  const kind = KINDS.includes(kindRaw as PropertyKind) ? (kindRaw as PropertyKind) : undefined;
  const unit = UNITS.includes(unitRaw as AreaUnit) ? (unitRaw as AreaUnit) : undefined;
  const abroad = sp.get("abroad") === "1";
  return { intent, kind, size: size || undefined, unit, abroad: abroad || undefined };
}
