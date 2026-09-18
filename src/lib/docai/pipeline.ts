import type { OcrStatus, PaperRead } from "@/types/check";
import { classifyPaper } from "./classify";
import { extractFields } from "./extract";
import { compressImage } from "@/lib/offline/compressImage";
import { DEFAULT_COMPRESS, RURAL_COMPRESS } from "@/lib/offline/rural";
import { enhanceForOcr } from "@/lib/offline/enhanceImage";
import { savePhoto } from "@/lib/offline/photos";
import { ocrImage } from "./ocr";
import { fingerprintImage } from "./imagePrint";

/** OCR then parser then structured fields. Validation, risk, and explanation run in evaluate(). */
export async function processPaperPhoto(file: Blob, photoKey: string, lowBw: boolean): Promise<PaperRead> {
  const small = await compressImage(file, lowBw ? RURAL_COMPRESS : DEFAULT_COMPRESS);
  const encrypted = await savePhoto(photoKey, small);

  let ocrStatus: OcrStatus = "skipped";
  let text = "";
  if (!lowBw) {
    try {
      const enhanced = await enhanceForOcr(small);
      text = await ocrImage(enhanced);
      ocrStatus = text ? "done" : "failed";
    } catch {
      ocrStatus = "failed";
    }
  }

  const { kind, confidence } = classifyPaper(text);
  let imagePrint: string | undefined;
  if (!lowBw) {
    try {
      imagePrint = (await fingerprintImage(small)) ?? undefined;
    } catch {
      imagePrint = undefined;
    }
  }
  return {
    photoKey,
    kind,
    kindConfidence: confidence,
    fields: extractFields(text),
    ocrStatus,
    encrypted,
    createdAt: new Date().toISOString(),
    imagePrint,
  };
}
