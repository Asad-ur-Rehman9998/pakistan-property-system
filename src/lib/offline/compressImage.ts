export function pickImageMime(supported: string[]): "image/webp" | "image/jpeg" {
  return supported.includes("image/webp") ? "image/webp" : "image/jpeg";
}

export function fitSize(width: number, height: number, maxEdge = 1280): { width: number; height: number } {
  const longest = Math.max(width, height, 1);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export type CompressOpts = { maxBytes?: number; maxEdge?: number };

function resolveOpts(arg?: CompressOpts | number): { maxBytes: number; maxEdge: number } {
  if (typeof arg === "number") return { maxBytes: arg, maxEdge: 1280 };
  return { maxBytes: arg?.maxBytes ?? 180_000, maxEdge: arg?.maxEdge ?? 1280 };
}

/** Shrink a camera photo so a cheap phone can keep it. Prefers WebP, else JPEG. */
export async function compressImage(file: Blob, opts?: CompressOpts | number): Promise<Blob> {
  const { maxBytes, maxEdge } = resolveOpts(opts);
  if (file.size <= maxBytes && (file.type === "image/webp" || file.type === "image/jpeg")) {
    return file;
  }
  const bitmap = await createImageBitmap(file);
  const size = fitSize(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  const mime = pickImageMime(["image/webp", "image/jpeg"]);
  let quality = maxEdge <= 800 ? 0.58 : 0.72;
  let blob: Blob | null = null;
  for (let i = 0; i < 5; i += 1) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mime, quality);
    });
    if (blob && blob.size <= maxBytes) break;
    quality -= 0.12;
  }
  return blob ?? file;
}
