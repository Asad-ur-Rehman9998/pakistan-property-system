function stretchContrast(data: Uint8ClampedArray) {
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const y = data[i];
    if (y < min) min = y;
    if (y > max) max = y;
  }
  const span = Math.max(1, max - min);
  for (let i = 0; i < data.length; i += 4) {
    const y = Math.round(((data[i] - min) * 255) / span);
    data[i] = y;
    data[i + 1] = y;
    data[i + 2] = y;
  }
}

/** Grayscale + contrast for OCR only. The stored photo stays the compressed camera image. */
export async function enhanceForOcr(blob: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return blob;
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return blob;
  }
  ctx.filter = "grayscale(1) contrast(1.3) brightness(1.05)";
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  ctx.filter = "none";
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  stretchContrast(img.data);
  ctx.putImageData(img, 0, 0);
  const out = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });
  return out ?? blob;
}

export { stretchContrast };
