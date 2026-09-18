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

function mustNot(body, needle, where) {
  if (body.includes(needle)) throw new Error(`Forbidden on ${where}: ${needle}`);
}

async function card(page) {
  return page.evaluate(() => document.querySelector("#duplicates")?.innerText || "");
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

async function openDup(page, path) {
  await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.querySelector("#duplicates"), { timeout: 15000 });
  await page.$eval("#duplicates", (el) => el.scrollIntoView({ block: "center" }));
  await delay(200);
  return card(page);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });

try {
  let s = await openDup(page, "/r/ex-urban");
  must(s, "Mumkina dohri listing", "urban title");
  must(s, "Yeh jaedad 3 doosri listings se milti julti lagti hai.", "urban 3 listings");
  must(s, "Muqabla", "urban compare");
  must(s, "Listing A — WhatsApp dealer", "listing A");
  must(s, "Listing B — Facebook dealer", "listing B");
  must(s, "Listing C — online listing", "listing C");
  must(s, "fraud ka ilzam nahi", "not fraud");
  must(s, "Plot / khasra: Match", "plot match chip");
  must(s, "Jagah: Match", "location match chip");
  mustNot(s, "dealer par jurm", "no crime accusation in card");

  await clickExact(page, "EN");
  s = await card(page);
  must(s, "Possible duplicate listing", "en title");
  must(s, "This property appears similar to 3 other listings.", "en summary");
  must(s, "This is not a finding of fraud", "en not fraud");
  must(s, "Compare", "en compare");
  must(s, "Listing A — WhatsApp dealer", "en listing A");

  await clickExact(page, "اردو");
  s = await card(page);
  must(s, "ممکنہ دوہری لسٹنگ", "ur title");
  must(s, "یہ جائیداد ۳ دیگر اشتہاروں سے ملتی جلتی لگتی ہے".replace("۳", "3"), "ur summary");
  must(s, "فراڈ کا الزام نہیں", "ur not fraud");

  await clickExact(page, "Roman");
  s = await openDup(page, "/r/ex-dup-a");
  must(s, "Mumkina dohri listing", "listing A title");
  must(s, "3 doosri listings", "listing A also has 3");
  must(s, "Shehri plot ki misal", "points back at city plot");
  must(s, "fraud ka ilzam nahi", "listing A not fraud");
  must(s, "Tasveerein: Match", "shared photo print among dealer ads");

  s = await openDup(page, "/r/ex-rural");
  must(s, "Mumkina dohri listing", "rural has the section");
  mustNot(s, "Listing A — WhatsApp dealer", "rural is not the DHA cluster");
  must(s, "mumkina naqal nahi", "rural no matches");

  s = await openDup(page, "/r/ex-token");
  mustNot(s, "Listing A — WhatsApp dealer", "token is not the DHA cluster");

  await page.goto(`${origin}/how`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await delay(400);
  const how = await page.evaluate(() => document.body?.innerText || "");
  must(how, "Mumkina naqal mushabihat hai, ilzam nahi", "how step");
  must(how, "Yeh fraud ka ilzam nahi", "how not fraud");

  console.log("Duplicate smoke passed: urban 3 langs, listing A, rural/token not clustered, how");
} catch (err) {
  console.error("DUP SMOKE FAILED:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
