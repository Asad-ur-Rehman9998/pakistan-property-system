"use client";

import { useEffect, useState } from "react";
import type { PaperRead } from "@/types/check";
import { compressImage } from "@/lib/offline/compressImage";
import { DEFAULT_COMPRESS, RURAL_COMPRESS } from "@/lib/offline/rural";
import { processPaperPhoto } from "@/lib/docai/pipeline";
import { scanUploadFile } from "@/lib/docai/scanUpload";
import { deletePhoto, listPhotoKeys, loadPhoto, savePhoto } from "@/lib/offline/photos";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useLowBandwidth } from "@/components/LowBwToggle";
import { track } from "@/lib/analytics/client";

const MAX = 4;

export function PaperPhoto({
  photoKey,
  multiple = false,
  reads = [],
  onReadsChange,
}: {
  photoKey: string;
  multiple?: boolean;
  reads?: PaperRead[];
  onReadsChange?: (reads: PaperRead[]) => void;
}) {
  const { t } = useI18n();
  const { on: lowBw } = useLowBandwidth();
  const [busy, setBusy] = useState(false);
  const [scanErr, setScanErr] = useState(false);
  const [items, setItems] = useState<{ key: string; url: string }[]>([]);

  const reload = async () => {
    const keys = multiple ? await listPhotoKeys(`${photoKey}-`) : (await loadPhoto(photoKey)) ? [photoKey] : [];
    const next: { key: string; url: string }[] = [];
    for (const key of keys) {
      const blob = await loadPhoto(key);
      if (blob) next.push({ key, url: URL.createObjectURL(blob) });
    }
    setItems((prev) => {
      for (const p of prev) URL.revokeObjectURL(p.url);
      return next;
    });
  };

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- IndexedDB photos are loaded after mount
    reload()
      .then(() => {
        if (!alive) {
          /* unmounted */
        }
      })
      .catch(() => {
        /* IDB missing */
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey, multiple]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (multiple && items.length >= MAX) return;
    setBusy(true);
    setScanErr(false);
    const key = multiple ? `${photoKey}-${Date.now()}` : photoKey;
    try {
      const scan = await scanUploadFile(file, file.name, file.type);
      if (!scan.ok) {
        setScanErr(true);
        return;
      }
      if (onReadsChange) {
        const read = await processPaperPhoto(file, key, lowBw);
        try {
          onReadsChange([...(reads.filter((r) => r.photoKey !== key)), read]);
        } catch {
          /* IndexedDB preview still reloads */
        }
      } else {
        const small = await compressImage(file, lowBw ? RURAL_COMPRESS : DEFAULT_COMPRESS);
        await savePhoto(key, small);
      }
      await reload();
      track("document_uploaded");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (key: string) => {
    await deletePhoto(key);
    onReadsChange?.(reads.filter((r) => r.photoKey !== key));
    await reload();
  };

  return (
    <div className="mt-2">
      <p className="text-sm leading-relaxed text-[var(--muted)]">{t.photoPaper}</p>
      {scanErr ? <p className="mt-2 text-sm text-[var(--red)]">{t.scanReject}</p> : null}
      <div className="mt-2 flex flex-col gap-2">
        <label className="btn-ghost min-h-12 w-full cursor-pointer">
          {busy ? t.photoWait : t.photoAdd}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
        </label>
        {multiple && items.length > 0 && items.length < MAX ? (
          <p className="text-xs text-[var(--muted)]">{t.photoMore}</p>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item.key} className="relative">
            {/* Compressed local preview — decrypted only in memory */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt=""
              className={lowBw ? "h-14 w-14 rounded-lg border border-[var(--line)] object-cover" : "h-28 w-28 rounded-lg border border-[var(--line)] object-cover"}
            />
            <button
              type="button"
              className="mt-1 block w-full text-xs font-semibold text-[var(--red)]"
              onClick={() => void remove(item.key)}
            >
              {t.photoRemove}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
