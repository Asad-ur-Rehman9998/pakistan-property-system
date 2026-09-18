import { deletePhotosByPrefix, wipePhotoStore } from "@/lib/offline/photos";
import { clearQueue } from "@/lib/offline/queue";
import { clearAnalyticsQueue } from "@/lib/analytics/client";
import { clearAllChecks, deleteCheck, loadChecks, replaceChecks } from "@/lib/storage";
import { clearDealerPages } from "@/lib/dealer/store";
import { isExpired, readRetentionDays } from "./retention";
import type { SavedCheck } from "@/types/check";

export async function deleteLocalCheck(check: SavedCheck): Promise<void> {
  deleteCheck(check.id);
  await deletePhotosByPrefix(`check-${check.id}`);
  if (check.shareKey) {
    try {
      await fetch(`/api/checks/${check.id}?k=${encodeURIComponent(check.shareKey)}`, { method: "DELETE" });
    } catch {
      /* offline — local papers are already gone */
    }
  }
}

export async function wipeLocalSensitive(): Promise<void> {
  clearQueue();
  clearAnalyticsQueue();
  clearAllChecks();
  clearDealerPages();
  await wipePhotoStore();
}

export function purgeExpiredChecks(): SavedCheck[] {
  const days = readRetentionDays();
  if (!days) return [];
  const all = loadChecks();
  const drop = all.filter((c) => isExpired(c.createdAt, days));
  if (!drop.length) return [];
  replaceChecks(all.filter((c) => !isExpired(c.createdAt, days)));
  for (const c of drop) void deletePhotosByPrefix(`check-${c.id}`);
  return drop;
}
