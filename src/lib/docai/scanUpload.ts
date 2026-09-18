/** Camera papers only. Never treat HTML, SVG, ZIP, or executables as a fard photo. */
export type ScanOk = { ok: true; kind: "jpeg" | "png" | "webp" | "gif" | "heic" };
export type ScanFail = { ok: false; reason: "empty" | "too_large" | "not_image" | "dangerous" };
export type ScanResult = ScanOk | ScanFail;

const MAX = 12 * 1024 * 1024;

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  return sig.every((b, i) => bytes[i] === b);
}

function looksHeic(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const brand = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  if (brand !== "ftyp") return false;
  const rest = String.fromCharCode(...bytes.slice(8, 12)).toLowerCase();
  return rest.startsWith("heic") || rest.startsWith("mif1") || rest.startsWith("msf1") || rest.startsWith("heif");
}

export function scanUploadBytes(bytes: Uint8Array, name = "", type = ""): ScanResult {
  if (!bytes.length) return { ok: false, reason: "empty" };
  if (bytes.length > MAX) return { ok: false, reason: "too_large" };
  const lower = `${name} ${type}`.toLowerCase();
  if (/\.(svg|html?|exe|js|mjs|xml|php|sh|bat|cmd|apk|zip|rar|7z|pdf)(\s|$)/i.test(name)) {
    return { ok: false, reason: "dangerous" };
  }
  if (startsWith(bytes, [0x4d, 0x5a]) || startsWith(bytes, [0x7f, 0x45, 0x4c, 0x46])) {
    return { ok: false, reason: "dangerous" };
  }
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) {
    return { ok: false, reason: "dangerous" };
  }
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 80)).trimStart().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<!doctype") || head.startsWith("<html") || head.startsWith("<?xml")) {
    return { ok: false, reason: "dangerous" };
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { ok: true, kind: "jpeg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return { ok: true, kind: "png" };
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return { ok: true, kind: "gif" };
  if (
    bytes.length >= 12 &&
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { ok: true, kind: "webp" };
  }
  if (looksHeic(bytes)) return { ok: true, kind: "heic" };
  if (lower.includes("svg") || lower.includes("html")) return { ok: false, reason: "dangerous" };
  return { ok: false, reason: "not_image" };
}

export async function scanUploadFile(file: Blob, name = "", type = ""): Promise<ScanResult> {
  const bytes = new Uint8Array(await file.slice(0, Math.min(MAX + 1, file.size)).arrayBuffer());
  return scanUploadBytes(bytes, name, type || file.type);
}
