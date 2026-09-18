const MAGIC = new Uint8Array([0x50, 0x43, 0x31, 0x45]); // PC1E

function asArrayBuffer(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function isEnvelope(bytes: Uint8Array): boolean {
  if (bytes.length < 17) return false;
  return MAGIC.every((b, i) => bytes[i] === b);
}

async function getSubtle(): Promise<SubtleCrypto | null> {
  const c = globalThis.crypto;
  return c?.subtle ?? null;
}

export async function generatePaperKey(): Promise<CryptoKey> {
  const subtle = await getSubtle();
  if (!subtle) throw new Error("no_crypto");
  return subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function exportKeyRaw(key: CryptoKey): Promise<ArrayBuffer> {
  const subtle = await getSubtle();
  if (!subtle) throw new Error("no_crypto");
  return subtle.exportKey("raw", key);
}

export async function importKeyRaw(raw: ArrayBuffer | Uint8Array): Promise<CryptoKey> {
  const subtle = await getSubtle();
  if (!subtle) throw new Error("no_crypto");
  const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  return subtle.importKey("raw", asArrayBuffer(bytes), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

export async function encryptBytes(key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const subtle = await getSubtle();
  if (!subtle) throw new Error("no_crypto");
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: asArrayBuffer(iv) }, key, asArrayBuffer(data)));
  return concat(concat(MAGIC, iv), ct);
}

export async function decryptBytes(key: CryptoKey, envelope: Uint8Array): Promise<Uint8Array> {
  const subtle = await getSubtle();
  if (!subtle) throw new Error("no_crypto");
  if (!isEnvelope(envelope)) throw new Error("not_encrypted");
  const iv = envelope.slice(4, 16);
  const ct = envelope.slice(16);
  return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(iv) }, key, asArrayBuffer(ct)));
}

export function looksEncrypted(data: Uint8Array): boolean {
  return isEnvelope(data);
}

export async function encryptBlob(key: CryptoKey, blob: Blob): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const env = await encryptBytes(key, bytes);
  return new Blob([asArrayBuffer(env)], { type: "application/octet-stream" });
}

export async function decryptBlob(key: CryptoKey, blob: Blob, fallbackType = "image/jpeg"): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!looksEncrypted(bytes)) return blob;
  const plain = await decryptBytes(key, bytes);
  return new Blob([asArrayBuffer(plain)], { type: fallbackType });
}
