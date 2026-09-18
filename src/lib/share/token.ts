import type { SavedCheck } from "@/types/check";

export function newShareKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashShareKey(key: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function reportSharePath(checkId: string, shareKey?: string): string {
  return shareKey ? `/r/${checkId}?k=${encodeURIComponent(shareKey)}` : `/r/${checkId}`;
}

export function sheetSharePath(checkId: string, shareKey?: string): string {
  return shareKey ? `/r/${checkId}/sheet?k=${encodeURIComponent(shareKey)}` : `/r/${checkId}/sheet`;
}

/** Mint a share secret on this phone. The raw key never goes to the server. */
export async function attachShareCapability(saved: SavedCheck): Promise<SavedCheck> {
  if (saved.shareKey && saved.shareTokenHash) return saved;
  const shareKey = saved.shareKey || newShareKey();
  const shareTokenHash = saved.shareTokenHash || (await hashShareKey(shareKey));
  return { ...saved, shareKey, shareTokenHash };
}

export function withExistingShare(next: SavedCheck, prev?: SavedCheck | null): SavedCheck {
  return {
    ...next,
    shareKey: next.shareKey || prev?.shareKey,
    shareTokenHash: next.shareTokenHash || prev?.shareTokenHash,
  };
}
