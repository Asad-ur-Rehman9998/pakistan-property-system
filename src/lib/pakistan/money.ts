import type { Lang } from "@/types/check";

const CRORE = 10_000_000;
const LAKH = 100_000;

/** Read PKR from Pakistani everyday writing: 2.5 crore, 80 lakh, 2,50,00,000. */
export function parsePkr(raw: string): number | null {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\u060c]/g, ",")
    .replace(/روپے|روپیہ|rupay|rupees?|rs\.?|pkr/gi, " ")
    .replace(/کرور/g, "crore")
    .replace(/کروڑ/g, "crore")
    .replace(/لاکھ/g, "lakh")
    .replace(/\blac\b/g, "lakh")
    .replace(/\bcr\b/g, "crore");

  if (!s) return null;

  let total = 0;
  const crore = s.match(/([\d]+(?:\.[\d]+)?)\s*crore/);
  const lakh = s.match(/([\d]+(?:\.[\d]+)?)\s*lakh/);
  if (crore) total += Number(crore[1]) * CRORE;
  if (lakh) total += Number(lakh[1]) * LAKH;
  if (total > 0) return Math.round(total);

  const compact = s.replace(/,/g, "").replace(/[^\d.]/g, "");
  const n = Number(compact);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatIndian(n: number): string {
  const s = Math.round(n).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(",")},${last3}`;
}

export function rupeesGrouped(n: number, lang: Lang = "en"): string {
  const grouped = formatIndian(n);
  if (lang === "ur") return `روپے ${grouped}`;
  return `Rs. ${grouped}`;
}

export function croreLakhPhrase(n: number, lang: Lang = "en"): string {
  if (n >= CRORE) {
    const c = n / CRORE;
    const shown = Number.isInteger(c) ? String(c) : c.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    if (lang === "ur") return `${shown} کروڑ`;
    if (lang === "roman") return `${shown} crore`;
    return `${shown} Crore`;
  }
  if (n >= LAKH) {
    const l = n / LAKH;
    const shown = Number.isInteger(l) ? String(l) : l.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    if (lang === "ur") return `${shown} لاکھ`;
    if (lang === "roman") return `${shown} lakh`;
    return `${shown} Lakh`;
  }
  return rupeesGrouped(n, lang);
}

export function formatPkr(n: number, lang: Lang = "en"): string {
  const grouped = formatIndian(n);
  if (n >= CRORE) {
    const c = n / CRORE;
    const shown = Number.isInteger(c) ? String(c) : c.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    if (lang === "ur") return `روپے ${shown} کروڑ (${grouped})`;
    if (lang === "roman") return `PKR ${shown} crore (${grouped})`;
    return `PKR ${shown} crore (${grouped})`;
  }
  if (n >= LAKH) {
    const l = n / LAKH;
    const shown = Number.isInteger(l) ? String(l) : l.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    if (lang === "ur") return `روپے ${shown} لاکھ (${grouped})`;
    if (lang === "roman") return `PKR ${shown} lakh (${grouped})`;
    return `PKR ${shown} lakh (${grouped})`;
  }
  if (lang === "ur") return `روپے ${grouped}`;
  return `PKR ${grouped}`;
}
