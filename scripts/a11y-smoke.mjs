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

async function clickContains(page, needle) {
  const handle = await page.evaluateHandle((n) => {
    const nodes = [...document.querySelectorAll("button, a, label")];
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
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

try {
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30000 });
  await delay(600);
  await must(page, "Asani", "access toggle");
  await must(page, "Kam data", "rural toggle still present");
  await must(page, "Zaroori nahi", "voice still on home");
  await must(page, "Property check karein", "main CTA");

  const skip = await page.$('a[href="#main"]');
  if (!skip) throw new Error("Skip-to-content link missing");

  await page.focus("body");
  await page.keyboard.press("Tab");
  const skipFocused = await page.evaluate(() => {
    const el = document.activeElement;
    return Boolean(el && el.getAttribute("href") === "#main");
  });
  if (!skipFocused) throw new Error("Keyboard Tab did not reach skip-to-content");

  await clickContains(page, "Asani");
  await delay(300);
  await must(page, "Bara text", "large text option");
  await must(page, "Zyada contrast", "high contrast option");
  await must(page, "Kam harkat", "reduced motion option");
  await must(page, "sadi zuban", "simple language hint");

  await clickContains(page, "Bara text");
  await delay(300);
  const large = await page.evaluate(() => document.documentElement.getAttribute("data-a11y-text") === "1");
  if (!large) throw new Error("Large text did not set data-a11y-text");
  const fontSize = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  if (fontSize < 18) throw new Error(`Large text font too small: ${fontSize}px`);

  await clickContains(page, "Zyada contrast");
  await delay(300);
  const contrast = await page.evaluate(() => document.documentElement.getAttribute("data-a11y-contrast") === "1");
  if (!contrast) throw new Error("High contrast did not set data-a11y-contrast");
  const ink = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim());
  if (!ink.includes("0")) throw new Error(`High contrast ink not dark: ${ink}`);

  await clickContains(page, "Kam harkat");
  await delay(300);
  const motion = await page.evaluate(() => document.documentElement.getAttribute("data-a11y-motion") === "1");
  if (!motion) throw new Error("Reduce motion did not set data-a11y-motion");

  const minH = await page.evaluate(() => {
    const el = document.querySelector(".btn-primary");
    return el ? parseFloat(getComputedStyle(el).minHeight) : 0;
  });
  if (minH < 44) throw new Error(`Touch target too small: ${minH}px`);

  await clickContains(page, "اردو");
  await delay(500);
  const rtl = await page.evaluate(() => document.documentElement.dir === "rtl" || document.body.querySelector("[dir='rtl']"));
  if (!rtl) throw new Error("Urdu did not switch the interface to RTL");
  await must(page, "جائیداد چیک کریں", "Urdu home CTA");

  await clickContains(page, "Roman");
  await delay(400);
  await must(page, "Zaroori nahi", "voice after language restore");

  await page.goto(`${origin}/how`, { waitUntil: "domcontentloaded" });
  await delay(400);
  await must(page, "Har shakhs asani se use kar sake", "how a11y");
  await must(page, "RTL Urdu", "how RTL");
  await must(page, "Screen reader", "how screen reader");

  console.log("Accessibility smoke passed: large text, contrast, skip link, keyboard, RTL, voice, motion");
} catch (err) {
  console.error("A11Y SMOKE FAILED:", err instanceof Error ? err.message : String(err));
  try {
    await page.screenshot({ path: path.join(process.cwd(), "data", "a11y-smoke-fail.png"), fullPage: true });
  } catch {
    /* ignore */
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}
