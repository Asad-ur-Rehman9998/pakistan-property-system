import puppeteer from "puppeteer-core";
import path from "node:path";

const origin = process.env.E2E_URL || "http://localhost:3000";
const chrome =
  process.env.CHROME ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function body(page) {
  return page.evaluate(() => document.body?.innerText || "");
}

async function must(page, needle, where) {
  const text = await body(page);
  if (!text.includes(needle)) throw new Error(`Missing on ${where}: ${needle}`);
}

async function clickLang(page, label) {
  const clicked = await page.evaluate((n) => {
    const nodes = [...document.querySelectorAll("button")];
    const el = nodes.find((btn) => (btn.textContent || "").replace(/\s+/g, " ").trim() === n);
    if (!el) return false;
    el.scrollIntoView({ block: "center" });
    el.click();
    return true;
  }, label);
  if (!clicked) throw new Error(`Could not click language: ${label}`);
  await delay(600);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });

try {
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30000 });
  await delay(500);
  await must(page, "Roman Urdu", "home full switch");
  await must(page, "Urdu", "home full switch Urdu");
  await must(page, "English", "home full switch English");
  await must(page, "EN", "header switch on home");
  await must(page, "Property check karein", "home roman");

  await clickLang(page, "EN");
  await delay(400);
  await must(page, "Check a Property", "home English via header EN");
  await must(page, "I am a Property Dealer", "home English dealer");

  await clickLang(page, "اردو");
  await delay(500);
  await must(page, "جائیداد چیک کریں", "home Urdu");
  await must(page, "میں پراپرٹی ڈیلر ہوں", "home Urdu dealer");

  await clickLang(page, "Roman Urdu");
  await delay(400);
  await must(page, "Property check karein", "home back to Roman");

  await page.goto(`${origin}/glossary`, { waitUntil: "domcontentloaded" });
  await delay(500);
  await must(page, "EN", "header language on glossary");
  await must(page, "Istalahat ki lughat", "terms dictionary roman");
  await must(page, "Fard", "fard kept");
  await must(page, "فرد", "fard urdu form shown");
  await must(page, "Yeh lafz rakhein", "keep this word");
  await must(page, "title deed", "do not call fard title deed");
  await must(page, "Khasra", "khasra kept");
  await must(page, "Intiqal", "intiqal kept");
  await must(page, "Aks Shajra", "aks shajra kept");
  await must(page, "Crore", "crore kept");
  await must(page, "Bayana", "bayana kept");

  await clickLang(page, "EN");
  await delay(400);
  await must(page, "Terminology dictionary", "glossary English");
  await must(page, "Keep this word", "keep label English");
  await must(page, "Do not call it", "do-not label English");
  await must(page, "Fard", "fard still Fard in English");
  await must(page, "title deed / ownership certificate", "English do-not for fard");
  await must(page, "Critical legal words are kept", "English keep policy");

  await clickLang(page, "اردو");
  await delay(500);
  await must(page, "اصطلاحات کی لغت", "glossary Urdu title");
  await must(page, "فرد", "fard in Urdu");
  await must(page, "یہ لفظ رکھیں", "keep in Urdu");
  await must(page, "اسے یہ نہ کہیں", "do-not in Urdu");

  await clickLang(page, "Roman");
  await delay(400);

  await page.goto(`${origin}/check`, { waitUntil: "domcontentloaded" });
  await delay(500);
  await must(page, "EN", "header on check");
  await must(page, "Roman", "header Roman on check");
  await clickLang(page, "EN");
  await delay(400);
  await must(page, "What do you want to do?", "check English");
  await clickLang(page, "اردو");
  await delay(500);
  await must(page, "آپ کیا کرنا چاہتے ہیں", "check Urdu");
  await clickLang(page, "Roman");
  await delay(400);
  await must(page, "Aap kya karna chahte hain", "check Roman");

  await page.goto(`${origin}/dealer`, { waitUntil: "domcontentloaded" });
  await delay(500);
  await must(page, "EN", "header on dealer");
  await clickLang(page, "EN");
  await delay(400);
  await must(page, "Create a trustworthy property information page.", "dealer English");
  await clickLang(page, "Roman");
  await delay(400);
  await must(page, "Bharosemand property maloomati page banayein", "dealer Roman");

  await page.goto(`${origin}/how`, { waitUntil: "domcontentloaded" });
  await delay(400);
  await must(page, "English, Urdu, Roman Urdu — qanooni alfaaz rakhe gaye", "how languages");
  await must(page, "title deed ya lot number nahi banate", "how no machine legal names");

  console.log("Language smoke passed: EN / Urdu / Roman, global header switch, terminology dictionary");
} catch (err) {
  console.error("LANG SMOKE FAILED:", err instanceof Error ? err.message : String(err));
  try {
    await page.screenshot({ path: path.join(process.cwd(), "data", "lang-smoke-fail.png"), fullPage: true });
  } catch {
    /* ignore */
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}
