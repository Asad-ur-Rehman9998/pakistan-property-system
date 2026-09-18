import puppeteer from "puppeteer-core";

const origin = process.env.E2E_URL || "http://localhost:3000";
const chrome =
  process.env.CHROME ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function must(body, needle, where) {
  if (!body.includes(needle)) throw new Error(`Missing on ${where}: ${needle}`);
}

function mustNot(body, re, where) {
  if (re.test(body)) throw new Error(`Forbidden on ${where}: ${re}`);
}

async function intel(page) {
  return page.evaluate(() => document.querySelector("#price-intel")?.innerText || "");
}

async function clickExact(page, needle) {
  const handle = await page.evaluateHandle((n) => {
    const nodes = [...document.querySelectorAll("button, a")];
    return nodes.find((el) => (el.textContent || "").replace(/\s+/g, " ").trim() === n) || null;
  }, needle);
  const el = handle.asElement();
  if (!el) throw new Error(`Could not click: ${needle}`);
  await el.click({ delay: 20 });
  await delay(400);
}

async function openIntel(page, path) {
  await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.querySelector("#price-intel"), { timeout: 15000 });
  await page.$eval("#price-intel", (el) => el.scrollIntoView({ block: "center" }));
  await delay(200);
  return intel(page);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });

try {
  let s = await openIntel(page, "/r/ex-token");
  must(s, "Qeemat ki samajh", "token title");
  must(s, "Mangi qeemat mukammal farokht ke barabar nahi", "token asking vs sold");
  must(s, "PKR 1.5 crore", "token asking");
  must(s, "Aap ki batayi. Tasdeeq shuda farokht nahi", "token asking is not a sale");
  must(s, "Asal deal ki qeemat", "token transaction label");
  must(s, "Maani khez andaze ke liye kafi mustanad data nahi", "token insufficient");
  must(s, "PKR 30 lakh", "token 1.5 crore / 5 marla");
  must(s, "PKR 6 crore", "token per kanal asking");
  must(s, "Fi square foot qeemat", "token sqft row");
  must(s, "Milte julte ishtehar", "token comparables");
  must(s, "Purani mangi qeematein", "token historical");
  must(s, "Kiraya ka andaza", "token rental");
  must(s, "Qeemat ki had", "token range");
  const insuff = (s.match(/Maani khez andaze ke liye kafi mustanad data nahi/g) || []).length;
  if (insuff < 6) throw new Error(`token expected 6+ insufficient rows, got ${insuff}`);
  mustNot(s, /sold for|market average|confirmed sale price of/i, "token");

  await clickExact(page, "EN");
  s = await intel(page);
  must(s, "Price intelligence", "en title");
  must(s, "Asking price is not the same as a completed sale", "en banner");
  must(s, "Actual transaction price", "en transaction");
  must(s, "Insufficient reliable data for a meaningful estimate.", "en insufficient");
  must(s, "PKR 30 lakh", "en per marla");
  must(s, "Comparable listings", "en comparables");
  must(s, "User-provided. Not a confirmed sale price", "en asking hint");

  await clickExact(page, "اردو");
  s = await intel(page);
  must(s, "قیمت کی سمجھ", "ur title");
  must(s, "اصل لین دین کی قیمت", "ur transaction");
  must(s, "معنی خیز اندازے کے لیے کافی مستند ڈیٹا نہیں", "ur insufficient");
  must(s, "منگی قیمت مکمل فروخت کے برابر نہیں", "ur asking vs sold");

  await clickExact(page, "Roman");

  s = await openIntel(page, "/r/ex-urban");
  must(s, "PKR 2.5 crore", "urban asking");
  must(s, "PKR 25 lakh", "urban per marla");
  must(s, "PKR 5 crore", "urban per kanal");
  must(s, "Maani khez andaze ke liye kafi mustanad data nahi", "urban no invented comps");

  s = await openIntel(page, "/r/ex-rural");
  must(s, "PKR 80 lakh", "rural asking");
  must(s, "PKR 1 lakh", "rural per marla from 80 lakh / 4 kanal");
  must(s, "PKR 20 lakh", "rural per kanal");
  must(s, "Asal deal ki qeemat", "rural transaction");

  await page.goto(`${origin}/how`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await delay(500);
  const how = await page.evaluate(() => document.body?.innerText || "");
  must(how, "Qeematein gharhte nahi", "how never invent prices");
  must(how, "Yeh ab bhi mangi hai, farokht nahi", "how asking is not a sale");

  console.log("Price intel smoke passed: token 3 langs, urban, rural, how");
} catch (err) {
  console.error("PRICE INTEL SMOKE FAILED:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
