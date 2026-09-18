/** 64-bit difference hash of a photo. Hamming distance is the comparison. */

export function hammingHex(a: string, b: string): number | null {
  if (!/^[0-9a-f]{16}$/i.test(a) || !/^[0-9a-f]{16}$/i.test(b)) return null;
  let n = 0;
  const x = BigInt(`0x${a}`);
  const y = BigInt(`0x${b}`);
  let v = x ^ y;
  while (v) {
    n += 1;
    v &= v - 1n;
  }
  return n;
}

function gray(data: Uint8ClampedArray, i: number): number {
  return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
}

function hashFromCanvas(ctx: CanvasRenderingContext2D): string {
  const { data } = ctx.getImageData(0, 0, 9, 8);
  let bits = 0n;
  let bit = 63n;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const left = gray(data, (y * 9 + x) * 4);
      const right = gray(data, (y * 9 + x + 1) * 4);
      if (left > right) bits |= 1n << bit;
      bit -= 1n;
    }
  }
  return bits.toString(16).padStart(16, "0");
}

/** Cheap perceptual print. Returns null off the phone (no canvas) or if the image cannot be read. */
export async function fingerprintImage(blob: Blob): Promise<string | null> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return null;
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, 9, 8);
    bitmap.close();
    return hashFromCanvas(ctx);
  } catch {
    return null;
  }
}
