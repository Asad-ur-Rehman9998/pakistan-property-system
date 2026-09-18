import puppeteer from "puppeteer-core";

const origin = process.env.E2E_URL || "http://localhost:3001";
const chrome =
  process.env.CHROME ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function text(page) {
  return page.evaluate(() => document.body?.innerText || "");
}

async function must(page, needle, where) {
  const body = await text(page);
  if (!body.includes(needle)) throw new Error(`Missing on ${where}: ${needle}`);
}

async function clickContains(page, needle) {
  const handle = await page.evaluateHandle((n) => {
    const nodes = [...document.querySelectorAll("button, a")];
    return nodes.find((el) => (el.textContent || "").replace(/\s+/g, " ").includes(n)) || null;
  }, needle);
  const el = handle.asElement();
  if (!el) throw new Error(`Could not click: ${needle}`);
  await el.click({ delay: 30 });
  await delay(400);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });

try {
  await page.goto(`${origin}/token`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => (document.body?.innerText || "").includes("Bechne wale ki shanakht"), {
    timeout: 15000,
  });
  await must(page, "Token dene se pehle", "token landing");
  await must(page, "Bechne wale ki shanakht", "item 1");
  await must(page, "Malkiat ki maloomat", "item 2");
  await must(page, "Jaedad ke kaghazat", "item 3");
  await must(page, "Jaedad ki hudood", "item 4");
  await must(page, "Baqi masail", "item 5");
  await must(page, "Society / developer ki haisiyat", "item 6");
  await must(page, "Qabza", "item 7");
  await must(page, "Utilities", "item 8");
  await must(page, "Tax / baqaya jahan lagu hon", "item 9");
  await must(page, "Farokht ka muahida", "item 10");
  await must(page, "Adaiagi ki tafseel", "item 11");
  await must(page, "Pesha war / qanooni jaiza", "item 12");
  const lower = (await text(page)).toLowerCase();
  if (lower.includes("fraud") && !lower.includes("fraud ka ilzam nahi")) {
    throw new Error("Token landing used fraud language");
  }

  await clickContains(page, "Yeh checklist shuru karein");
  await page.waitForFunction(() => location.pathname.startsWith("/check"), { timeout: 15000 });
  await delay(600);
  await must(page, "Token dene se pehle", "token banner in wizard");
  await must(page, "Jaedad ki qisam kya hai", "skips intent, starts at kind");
  const body = await text(page);
  if (body.includes("Aap kya karna chahte hain") && !body.includes("Jaedad ki qisam")) {
    throw new Error("Token entry still on intent screen");
  }

  await page.goto(`${origin}/r/ex-token`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(
    () => (document.body?.innerText || "").includes("Property due-diligence checklist"),
    { timeout: 15000 },
  );
  await must(page, "Abhi token na dein", "rushed token stop");
  await must(page, "Maloomat aur tasdeeq ki haisiyat", "info status");
  await must(page, "Zyada tawajjoh", "high attention");
  await must(page, "Property due-diligence checklist", "generated sheet");
  await must(page, "Bechne wale ki shanakht", "sheet item");
  await must(page, "Ghaib", "missing marks");
  await must(page, "Tasdeeq darkar", "verify marks");
  await must(page, "N/A", "na mark");
  await must(page, "qanooni taur par verified nahi", "not verified");
  await must(page, "Qeemat ki samajh", "price intel");
  await must(page, "Mangi qeemat mukammal farokht ke barabar nahi", "asking vs sold");
  await must(page, "Asal deal ki qeemat", "transaction label");
  await must(page, "Maani khez andaze ke liye kafi mustanad data nahi", "insufficient");
  await must(page, "PKR 30 lakh", "30 lakh asking per marla");
  await must(page, "Milte julte ishtehar", "comparables");
  const report = (await text(page)).toLowerCase();
  if (/\bfraud\b/.test(report) && !report.includes("fraud ka ilzam nahi")) {
    throw new Error("Token report called fraud");
  }

  await clickContains(page, "اردو");
  await delay(500);
  await must(page, "پراپرٹی ڈیو ڈیلی جنس چیک لسٹ", "Urdu checklist title");
  await must(page, "ابھی ٹوکن نہ دیں", "Urdu stop headline");

  console.log("Token smoke passed: landing, wizard entry, example checklist, Urdu");
} catch (err) {
  console.error("TOKEN SMOKE FAILED:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
} finally {
  await browser.close();
}
