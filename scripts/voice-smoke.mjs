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

async function clickExact(page, label) {
  const clicked = await page.evaluate((n) => {
    const nodes = [...document.querySelectorAll("button, a")];
    const el = nodes.find((btn) => (btn.textContent || "").replace(/\s+/g, " ").trim() === n);
    if (!el) return false;
    el.scrollIntoView({ block: "center" });
    el.click();
    return true;
  }, label);
  if (!clicked) throw new Error(`Could not click: ${label}`);
  await delay(500);
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
  await delay(600);
  await must(page, "Zaroori nahi", "voice is optional");
  await must(page, "Property check karein", "typed check still present");
  await must(page, "Yeh chatbot nahi", "not a chatbot");
  await must(page, "Mujhe 5 marla ghar check karna hai.", "check example");
  await must(page, "Mujhe token dene se pehle kya check karna chahiye?", "token example");

  await clickExact(page, "Mujhe 5 marla ghar check karna hai.");
  await delay(400);
  await must(page, "5 Marla", "heard size");
  await must(page, "Ghar", "heard house");
  await must(page, "Yeh check shuru karein", "start from voice");
  await clickExact(page, "Yeh check shuru karein");
  await page.waitForFunction(() => (document.body?.innerText || "").includes("Aap kya karna chahte hain"), {
    timeout: 15000,
  });
  await must(page, "Jo aap ne kaha us se bhara", "wizard voice banner");
  await must(page, "Ghar", "house filled");
  await must(page, "5 Marla", "size filled");
  if (!page.url().includes("from=voice")) throw new Error("Check URL missing from=voice");
  if (!page.url().includes("kind=house")) throw new Error("Check URL missing kind");
  if (!page.url().includes("size=5")) throw new Error("Check URL missing size");

  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await delay(500);
  await clickExact(page, "Mujhe token dene se pehle kya check karna chahiye?");
  await delay(400);
  await must(page, "Bechne wale ki shanakht", "token list roman");
  await must(page, "Farokht ka muahida", "token sale agreement");
  await must(page, "qanooni taur par mehfooz nahi", "never legally safe");

  await clickExact(page, "EN");
  await delay(500);
  await clickExact(page, "Mujhe token dene se pehle kya check karna chahiye?");
  await delay(400);
  await must(page, "Seller identity", "token answer follows English");
  await must(page, "Sale agreement", "token answer English agreement");

  await clickExact(page, "اردو");
  await delay(500);
  await clickExact(page, "Mujhe token dene se pehle kya check karna chahiye?");
  await delay(400);
  await must(page, "بیچنے والے کی شناخت", "token answer follows Urdu");

  await clickExact(page, "Roman");
  await delay(400);
  await clickExact(page, "Mujhe token dene se pehle kya check karna chahiye?");
  await delay(400);
  await clickExact(page, "Token ki checklist kholen");
  await page.waitForFunction(() => location.pathname.includes("/token"), { timeout: 15000 });
  await must(page, "Bechne wale ki shanakht", "token page after voice CTA");

  console.log("Voice smoke passed: optional mic, speech-to-text path, check start, token answer in selected language");
} catch (err) {
  console.error("VOICE SMOKE FAILED:", err instanceof Error ? err.message : String(err));
  try {
    await page.screenshot({ path: path.join(process.cwd(), "data", "voice-smoke-fail.png"), fullPage: true });
  } catch {
    /* ignore */
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}
