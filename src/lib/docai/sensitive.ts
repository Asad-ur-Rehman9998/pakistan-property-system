const CNIC_RE = /\b(\d{5})[-\s]?(\d{7})[-\s]?(\d)\b/g;
const CNIC_COMPACT = /\b(\d{13})\b/g;

export function cnicDigits(raw: string): string | null {
  const compact = raw.replace(/\D/g, "");
  if (compact.length === 13 && /^\d{13}$/.test(compact)) return compact;
  return null;
}

export function maskCnic(digits: string): string {
  if (digits.length !== 13) return "••••-•••••••-•";
  return `•••••-•••••••-${digits.slice(-1)}`;
}

/** Last four digits only — never persist the rest. */
export function cnicLast4(digits: string): string {
  return digits.slice(-4);
}

export function formatCnicLast4(last4: string): string {
  const d = last4.replace(/\D/g, "").slice(-4);
  if (d.length !== 4) return "CNIC ••••";
  return `CNIC ending ${d}`;
}

export function findCnics(text: string): string[] {
  const found = new Set<string>();
  const s = text || "";
  for (const m of s.matchAll(CNIC_RE)) {
    const digits = `${m[1]}${m[2]}${m[3]}`;
    if (digits.length === 13) found.add(digits);
  }
  for (const m of s.matchAll(CNIC_COMPACT)) {
    found.add(m[1]);
  }
  return [...found];
}

/** Strip CNIC numbers from text that may be stored or shared. */
export function stripCnics(text: string): string {
  if (!text) return text;
  return text
    .replace(CNIC_RE, "CNIC (hidden)")
    .replace(CNIC_COMPACT, (m) => (cnicDigits(m) ? "CNIC (hidden)" : m));
}

export function looksLikeCnic(value: string): boolean {
  return cnicDigits(value) !== null || /\d{5}[-\s]\d{7}[-\s]\d/.test(value);
}
