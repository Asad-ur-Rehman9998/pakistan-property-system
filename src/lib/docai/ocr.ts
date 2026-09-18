type OcrWorker = {
  recognize: (image: Blob) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
};

let worker: OcrWorker | null = null;
let loading: Promise<OcrWorker> | null = null;

async function loadWorker(): Promise<OcrWorker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/tesseract-core-simd-lstm.wasm.js",
    langPath: "/ocr",
    workerBlobURL: false,
    gzip: true,
  });
}

export async function ocrImage(blob: Blob): Promise<string> {
  try {
    if (!loading) loading = loadWorker();
    worker = await loading;
    const { data } = await worker.recognize(blob);
    return (data.text || "").trim();
  } catch {
    worker = null;
    loading = null;
    return "";
  }
}

export async function terminateOcr() {
  try {
    await worker?.terminate();
  } catch {
    /* ignore */
  }
  worker = null;
  loading = null;
}
