const HONORIFICS =
  /\b(s\/o|d\/o|w\/o|c\/o|son of|daughter of|wife of|bin|ibn|mr|mrs|ms|malik|janab)\b/gi;

export function normalizeName(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .replace(HONORIFICS, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function namesLikelySame(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb || na.length < 3 || nb.length < 3) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return na.length >= 6 || nb.length >= 6;
  const ta = tokens(na);
  const tb = tokens(nb);
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit >= 2;
}

export function namesConflict(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na.length < 4 || nb.length < 4) return false;
  return !namesLikelySame(a, b);
}

function tokens(n: string): Set<string> {
  return new Set(n.split(" ").filter((t) => t.length > 2 && t !== "muhammad" && t !== "mohammad"));
}

export function normalizeId(raw: string): string {
  return String(raw || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[.,]/g, "");
}

export function idsConflict(a: string, b: string): boolean {
  const na = normalizeId(a);
  const nb = normalizeId(b);
  if (na.length < 2 || nb.length < 2) return false;
  return na !== nb;
}
