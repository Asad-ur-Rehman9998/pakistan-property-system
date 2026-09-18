import { stripCnics } from "@/lib/docai/sensitive";

/** Meta Click-to-Chat — the official share URL. This app never reads chats or groups. */
export const WHATSAPP_CLICK_TO_CHAT = "https://wa.me";

/**
 * Pakistan mobile digits for wa.me/{number}.
 * User-typed numbers only. 13-digit values look like a CNIC and are refused.
 */
export function pakistanWaDigits(raw: string): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length === 13 || digits.length > 15) return null;
  let n = digits;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("0") && n.length === 11) n = `92${n.slice(1)}`;
  if (n.length === 10 && n.startsWith("3")) n = `92${n}`;
  if (n.startsWith("92") && n.length >= 12 && n.length <= 13) return n;
  return null;
}

/** Official WhatsApp share / click-to-chat. Never a scraper, never a private-API client. */
export function whatsappHref(text: string, phone?: string): string {
  const clean = stripCnics(String(text || "")).slice(0, 3500);
  const q = encodeURIComponent(clean);
  const digits = phone ? pakistanWaDigits(phone) : null;
  return digits ? `${WHATSAPP_CLICK_TO_CHAT}/${digits}?text=${q}` : `${WHATSAPP_CLICK_TO_CHAT}/?text=${q}`;
}

export function isOfficialWhatsAppHref(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "https:" && u.hostname === "wa.me";
  } catch {
    return false;
  }
}
