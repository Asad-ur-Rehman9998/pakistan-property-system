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

async function mustI(page, needle, where) {
  const text = (await body(page)).toLowerCase();
  if (!text.includes(needle.toLowerCase())) throw new Error(`Missing on ${where}: ${needle}`);
}

async function mustNot(page, needle, where) {
  const text = await body(page);
  if (text.includes(needle)) throw new Error(`Forbidden on ${where}: ${needle}`);
}

async function clickContains(page, needle) {
  const handle = await page.evaluateHandle((n) => {
    const nodes = [...document.querySelectorAll("button, a")];
    return nodes.find((el) => (el.textContent || "").replace(/\s+/g, " ").includes(n)) || null;
  }, needle);
  const el = handle.asElement();
  if (!el) throw new Error(`Could not click: ${needle}`);
  await el.evaluate((node) => node.scrollIntoView({ block: "center" }));
  await delay(120);
  await el.click({ delay: 30 });
  await delay(400);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 640, isMobile: true, hasTouch: true });

try {
  await page.goto(`${origin}/r/ex-urban`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => (document.body?.innerText || "").includes("PropertyCheck report"), {
    timeout: 15000,
  });
  await mustNot(page, "SMS se bhejein", "SMS hidden before rural");
  const qrBefore = await page.$("#share-sheet svg");
  if (!qrBefore) throw new Error("QR should still show before rural mode");

  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30000 });
  await delay(500);
  await must(page, "Kam data", "rural toggle");
  await must(page, "Zaroori nahi", "voice stays on home");
  await must(page, "Property check karein", "main CTA");

  await clickContains(page, "Kam data");
  await delay(400);

  const ruralOn = await page.evaluate(() => document.documentElement.getAttribute("data-low-bw") === "1");
  if (!ruralOn) throw new Error("html[data-low-bw] missing after turning rural on");
  await must(page, "Dehi mode", "rural hint");
  await must(page, "Zaroori nahi", "voice still present in rural");
  await must(page, "baray button", "larger-button copy");

  const minH = await page.evaluate(() => {
    const el = document.querySelector(".btn-primary");
    return el ? parseFloat(getComputedStyle(el).minHeight) : 0;
  });
  if (minH < 60) throw new Error(`Rural primary button too small: ${minH}px`);

  await page.goto(`${origin}/check`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.getAttribute("data-low-bw") === "1", {
    timeout: 10000,
  });
  await page.waitForFunction(
    () => (document.body?.innerText || "").includes("Aap kya karna chahte hain"),
    { timeout: 20000 },
  );
  await page.waitForSelector("#wizard-progress", { timeout: 10000 });
  await must(page, "Pesh raft is phone par mehfooz", "offline draft progress");
  await mustI(page, "step", "step label");

  await page.goto(`${origin}/r/ex-urban`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => (document.body?.innerText || "").includes("SMS se bhejein"),
    { timeout: 15000 },
  );
  const sms = await page.evaluate(() =>
    [...document.querySelectorAll("a")]
      .map((el) => el.getAttribute("href") || "")
      .find((h) => h.startsWith("sms:")),
  );
  if (!sms) throw new Error("sms: link missing on rural report");
  if (!sms.startsWith("sms:")) throw new Error("SMS href is not sms:");
  const decoded = decodeURIComponent(sms);
  if (!decoded.includes("qanooni mehfooz nahi")) throw new Error("SMS body missing not-legally-safe");
  if (decoded.includes("35202")) throw new Error("SMS body leaked a CNIC-like number");

  const qrAfter = await page.$("#share-sheet svg");
  if (qrAfter) throw new Error("QR should be omitted in rural / text-first mode");
  await mustNot(page, "QR code", "QR copy hidden in rural");

  await page.goto(`${origin}/how`, { waitUntil: "domcontentloaded" });
  await delay(400);
  await must(page, "Dehi / kam data mode saste Android ke liye", "how rural");
  await must(page, "Sasta Android chal sake", "how cheap Android");

  console.log("Rural / low-data smoke passed: text-first, SMS fallback, voice, drafts, larger taps");
} catch (err) {
  console.error("RURAL SMOKE FAILED:", err instanceof Error ? err.message : String(err));
  try {
    await page.screenshot({ path: path.join(process.cwd(), "data", "rural-smoke-fail.png"), fullPage: true });
  } catch {
    /* ignore */
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}
