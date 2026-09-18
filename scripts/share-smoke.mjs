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
await page.setViewport({ width: 390, height: 844, isMobile: true });

try {
  await page.goto(`${origin}/r/ex-urban`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => (document.body?.innerText || "").includes("PropertyCheck report"), {
    timeout: 15000,
  });

  await must(page, "PropertyCheck report", "full report sheet");
  await must(page, "10 Marla Plot", "property line");
  await must(page, "DHA Phase 6", "location");
  await must(page, "Lahore", "city");
  await must(page, "2.5 crore", "asking price");
  await must(page, "Maloomat ki haisiyat", "status heading");
  await must(page, "Kaghazat", "documents");
  await must(page, "ghaib", "a missing document");
  await must(page, "upload", "an uploaded document");
  await must(page, "Qeemat ki maloomat", "price block");
  await must(page, "Farokht / market had", "no invented range label");
  await must(page, "Gharhi nahi", "range not invented");
  await must(page, "qanooni certificate nahi", "not a legal certificate");
  await must(page, "qanooni mashwara", "not legal advice");
  await must(page, "title certification", "not title certification");
  await must(page, "sarkari tasdeeq: 0", "official verification zero");
  await must(page, "QR code", "QR label");
  await must(page, "Web report", "web CTA");
  await must(page, "Print / PDF", "pdf CTA");
  await must(page, "WhatsApp khulasa", "whatsapp CTA");

  const qr = await page.$("#share-sheet svg");
  if (!qr) throw new Error("QR SVG missing on full report");

  const full = await body(page);
  if (/sold for|confirmed sale price of|market average|Rs\. X/i.test(full)) {
    throw new Error("Full report invented a sale or market range");
  }

  await page.evaluate(() => {
    window.__printed = false;
    window.print = () => {
      window.__printed = true;
    };
  });
  await clickContains(page, "Print / PDF");
  const printed = await page.evaluate(() => window.__printed);
  if (!printed) throw new Error("Print / PDF did not call print()");

  const wa = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find((el) =>
      (el.textContent || "").includes("WhatsApp khulasa"),
    );
    return a?.getAttribute("href") || "";
  });
  if (!wa.startsWith("https://wa.me/")) throw new Error("WhatsApp summary is not a wa.me link");
  const decoded = decodeURIComponent(wa);
  if (!decoded.toLowerCase().includes("qanooni certificate nahi")) {
    throw new Error("WhatsApp summary missing not-a-certificate line");
  }
  if (!decoded.includes("/r/ex-urban/sheet")) throw new Error("WhatsApp summary missing sheet URL");
  if (/sold for|market average/i.test(decoded)) throw new Error("WhatsApp summary invented sale prices");

  const allWa = await page.evaluate(() => {
    return [...document.querySelectorAll("a")]
      .map((el) => decodeURIComponent(el.getAttribute("href") || ""))
      .filter((h) => h.startsWith("https://wa.me/"))
      .join("\n");
  });
  if (!allWa.includes("Ghaib kaghazat ki darkhwast")) throw new Error("Missing-document WhatsApp request absent");
  if (!allWa.toLowerCase().includes("chats ya groups nahi parhti")) {
    throw new Error("WhatsApp copy must say chats are not read");
  }

  await clickContains(page, "Web report");
  await page.waitForFunction(() => location.pathname.includes("/r/ex-urban/sheet"), { timeout: 10000 });
  await delay(400);
  await must(page, "PropertyCheck report", "standalone sheet");
  await must(page, "10 Marla Plot", "standalone property");
  await must(page, "DHA Phase 6, Lahore", "standalone location");
  await must(page, "QR code", "standalone QR");
  if (!(await page.$("#share-sheet svg"))) throw new Error("QR SVG missing on standalone sheet");

  await page.goto(`${origin}/r/ex-papers`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (document.body?.innerText || "").includes("PropertyCheck report"), {
    timeout: 15000,
  });
  await must(page, "Raqba wazahat chahta hai", "papers area needs clarification");
  await must(page, "fraud ka ilzam nahi", "papers inconsistency is not fraud");

  await page.goto(`${origin}/r/ex-urban/sheet`, { waitUntil: "domcontentloaded" });
  await delay(500);
  await clickContains(page, "EN");
  await delay(400);
  await must(page, "Asking price", "English asking");
  await must(page, "This report is not a legal certificate", "English disclaimer");
  await must(page, "Independent verification is recommended", "English independent check");
  await must(page, "Sale / market range: insufficient reliable data. Not invented.", "English no fake range");
  await mustNot(page, "This is a verified listing", "English verified listing");

  await page.goto(`${origin}/r/ex-token`, { waitUntil: "domcontentloaded" });
  await delay(500);
  await clickContains(page, "Roman");
  await delay(400);
  const tokenWa = await page.evaluate(() => {
    return [...document.querySelectorAll("a")]
      .map((el) => decodeURIComponent(el.getAttribute("href") || ""))
      .filter((h) => h.startsWith("https://wa.me/"))
      .join("\n");
  });
  if (!tokenWa.includes("Token se pehle due-diligence checklist")) {
    throw new Error("Token report missing checklist WhatsApp share");
  }
  if (!tokenWa.includes("Bechne wale ki shanakht")) throw new Error("Checklist WhatsApp missing seller identity");

  await page.goto(`${origin}/how`, { waitUntil: "domcontentloaded" });
  await delay(400);
  await clickContains(page, "Roman");
  await delay(400);
  await must(page, "Har jaedad ki saada shareable report", "how page");
  await must(page, "qanooni certificate nahi", "how not a certificate");
  await must(page, "Har zaroori kaam WhatsApp par bhejein", "how whatsapp first");
  await must(page, "scrape nahi", "how no scrape");
  await must(page, "Dehi / kam data mode saste Android ke liye", "how rural");
  await must(page, "SMS fallback", "how SMS");
  await must(page, "Har shakhs asani se use kar sake", "how a11y");
  await must(page, "Screen reader", "how screen reader");
  await must(page, "Kaghazat sensitive hain — public nahi", "how security");
  await must(page, "signed link", "how signed urls");
  await must(page, "Staff desk alag permissions — unlimited nahi", "how admin");

  console.log("Shareable report smoke passed: web sheet, PDF print, WhatsApp summary, QR, papers, English");
} catch (err) {
  console.error("SHARE SMOKE FAILED:", err instanceof Error ? err.message : String(err));
  try {
    await page.screenshot({ path: path.join(process.cwd(), "data", "share-smoke-fail.png"), fullPage: true });
  } catch {
    /* ignore */
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}
