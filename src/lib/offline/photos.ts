import { decryptBlob, encryptBlob, exportKeyRaw, generatePaperKey, importKeyRaw } from "@/lib/docai/crypto";

const DB = "propertycheck-photos";
const STORE = "photos";
const KEYS = "keys";
const KEY_ID = "paper-aes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(KEYS)) db.createObjectStore(KEYS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDb();
  const value = await new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return value;
}

async function idbPut(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

let memKey: CryptoKey | null = null;

export async function getDeviceKey(): Promise<CryptoKey> {
  if (memKey) return memKey;
  const stored = await idbGet<ArrayBuffer>(KEYS, KEY_ID);
  if (stored) {
    memKey = await importKeyRaw(stored);
    return memKey;
  }
  const key = await generatePaperKey();
  await idbPut(KEYS, KEY_ID, await exportKeyRaw(key));
  memKey = key;
  return key;
}

export async function savePhoto(key: string, blob: Blob): Promise<boolean> {
  let stored = blob;
  let encrypted = false;
  try {
    stored = await encryptBlob(await getDeviceKey(), blob);
    encrypted = true;
  } catch {
    stored = blob;
  }
  await idbPut(STORE, key, stored);
  return encrypted;
}

export async function loadPhoto(key: string): Promise<Blob | null> {
  const stored = await idbGet<Blob>(STORE, key);
  if (!stored) return null;
  try {
    return await decryptBlob(await getDeviceKey(), stored);
  } catch {
    return stored;
  }
}

export async function listPhotoKeys(prefix: string): Promise<string[]> {
  const db = await openDb();
  const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return keys.map(String).filter((k) => k.startsWith(prefix)).sort();
}

export async function deletePhoto(key: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function deletePhotosByPrefix(prefix: string): Promise<void> {
  const keys = await listPhotoKeys(prefix);
  for (const key of keys) await deletePhoto(key);
}

export async function wipePhotoStore(): Promise<void> {
  memKey = null;
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("idb"));
    req.onblocked = () => resolve();
  });
}

export function checkPhotoKey(checkId: string, index: number): string {
  return `check-${checkId}-${index}`;
}

export const DRAFT_PHOTO_PREFIX = "draft-papers";
