import fs from "node:fs";
import path from "node:path";

const dest = path.join(process.cwd(), "public", "ocr");
fs.mkdirSync(dest, { recursive: true });

const copies = [
  ["node_modules/tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"],
];

for (const [from, to] of copies) {
  const src = path.join(process.cwd(), from);
  if (!fs.existsSync(src)) {
    console.warn("vendor-ocr: missing", from);
    continue;
  }
  fs.copyFileSync(src, path.join(dest, to));
}

const tess = path.join(dest, "eng.traineddata.gz");
if (!fs.existsSync(tess) || fs.statSync(tess).size < 1000) {
  const url = "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz";
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    fs.writeFileSync(tess, Buffer.from(await res.arrayBuffer()));
    console.log("vendor-ocr: downloaded eng.traineddata.gz");
  } catch (err) {
    console.warn("vendor-ocr: tessdata download skipped", err instanceof Error ? err.message : err);
  }
}

console.log("vendor-ocr: ready", dest);
