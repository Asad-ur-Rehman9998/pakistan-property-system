import type { AreaUnit } from "@/types/check";
import type { DealerImportRow } from "@/types/dealer";
import { parseAreaPhrase } from "@/lib/pakistan/area";

function looksHeader(line: string): boolean {
  const s = line.toLowerCase();
  return /\bcity\b/.test(s) && /\b(plot|area|society|khasra)\b/.test(s);
}

function cells(line: string): string[] {
  return line
    .split(/[,;\t|]+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

function asUnit(raw: string): { size: string; unit: AreaUnit | null } {
  const parsed = parseAreaPhrase(raw);
  if (parsed?.amount && parsed.unit) return { size: String(parsed.amount), unit: parsed.unit };
  const n = raw.match(/(\d+(?:\.\d+)?)/);
  return { size: n ? n[1] : raw, unit: null };
}

/** Parse a dealer paste of properties. Missing prices stay empty — never invented. */
export function parseDealerImport(raw: string): DealerImportRow[] {
  const lines = String(raw || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: DealerImportRow[] = [];
  for (const line of lines) {
    if (looksHeader(line)) continue;
    const parts = cells(line);
    if (parts.length < 2) continue;
    const city = parts[0] || "";
    const area = parts[1] || "";
    let plotNumber = "";
    let khasraNumber = "";
    let areaSize = "";
    let areaUnit: AreaUnit | null = null;
    let price = "";
    for (const part of parts.slice(2)) {
      if (/khasra|خسرہ/i.test(part) || /^\d+\/\d+$/.test(part)) {
        khasraNumber = part.replace(/khasra/i, "").replace(/خسرہ/g, "").trim();
        continue;
      }
      if (/\d/.test(part) && /marla|kanal|acre|sq\.?\s*(yd|ft)|gaz|مرلہ|کنال|ایکڑ/i.test(part)) {
        const u = asUnit(part);
        areaSize = u.size;
        areaUnit = u.unit;
        continue;
      }
      if (/crore|lakh|lac|\bpkr\b|\brs\.?\b|کروڑ|لاکھ/i.test(part)) {
        price = part;
        continue;
      }
      if (!plotNumber && /[A-Za-z0-9]/.test(part)) {
        plotNumber = part.replace(/^(plot|file)\s*/i, "").trim();
      }
    }
    if (!city && !area && !plotNumber && !khasraNumber) continue;
    out.push({ city, area, plotNumber, khasraNumber, areaSize, areaUnit, price });
    if (out.length >= 40) break;
  }
  return out;
}
