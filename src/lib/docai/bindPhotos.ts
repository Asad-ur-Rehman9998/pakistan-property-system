import type { PaperRead } from "@/types/check";
import {
  checkPhotoKey,
  deletePhotosByPrefix,
  DRAFT_PHOTO_PREFIX,
  loadPhoto,
  savePhoto,
} from "@/lib/offline/photos";

/** Move draft camera files onto this check, then drop leftover draft keys. */
export async function bindDraftPhotosToCheck(checkId: string, reads: PaperRead[]): Promise<PaperRead[]> {
  const next: PaperRead[] = [];
  for (let i = 0; i < reads.length; i += 1) {
    const read = reads[i];
    const key = checkPhotoKey(checkId, i);
    const blob = await loadPhoto(read.photoKey);
    if (blob && read.photoKey !== key) await savePhoto(key, blob);
    next.push({ ...read, photoKey: key });
  }
  await deletePhotosByPrefix(DRAFT_PHOTO_PREFIX);
  return next;
}
