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
  await delay(450);
}

async function fillPlaceholder(page, placeholder, value) {
  const el = await page.$(`input[placeholder="${placeholder}"]`);
  if (!el) throw new Error(`Missing input: ${placeholder}`);
  await el.click({ clickCount: 3 });
  await el.type(value, { delay: 12 });
}

async function setDate(page, index, value) {
  const ok = await page.evaluate(
    (i, v) => {
      const el = document.querySelectorAll('input[type="date"]')[i];
      if (!el) return false;
      const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
      desc?.set?.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return el.value === v;
    },
    index,
    value,
  );
  if (!ok) throw new Error(`Could not set date input ${index}`);
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
  await must(page, "Main property dealer hoon", "home dealer CTA");
  await clickContains(page, "Main property dealer hoon");
  await page.waitForFunction(() => location.pathname.startsWith("/dealer"), { timeout: 10000 });
  await delay(400);

  await must(page, "Bharosemand property maloomati page banayein", "dashboard job");
  await must(page, "Yeh CRM, lead pipeline ya listing board nahi", "dashboard not CRM");
  await must(page, "Qeemat nahi gharhte", "import never invents price");
  await must(page, "Property page shamil karein", "add form");

  await clickContains(page, "Yeh maloomati page mehfooz karein");
  await delay(300);
  if (!page.url().endsWith("/dealer") && !page.url().endsWith("/dealer/")) {
    throw new Error("Empty add form should stay on /dealer");
  }

  await fillPlaceholder(page, "Lahore", "Lahore");
  await fillPlaceholder(page, "Maslan DHA Phase 6, Bahria Town", "Bahria Town");
  await fillPlaceholder(page, "Maslan 412, ya file 219", "88");
  await fillPlaceholder(page, "10", "10");
  await clickContains(page, "Marla");
  await fillPlaceholder(page, "Maslan 2.5 crore", "1.8 crore");
  await clickContains(page, "Yeh maloomati page mehfooz karein");
  await page.waitForFunction(() => /\/dealer\/[A-Za-z0-9_-]+/.test(location.pathname), { timeout: 10000 });
  await delay(400);

  await must(page, "Bahria Town", "workspace title");
  await must(page, "Plot 88", "workspace plot");
  await must(page, "1.8 crore", "workspace asking price");
  await must(page, "Abhi report nahi", "no report yet");
  await must(page, "Due-diligence report banayein", "create report CTA");
  await must(page, "Is platform se sarkari tasdeeq: 0", "official verification is zero");
  await must(page, "Pehle check chalayen", "public link waits for report");
  await mustNot(page, "Page WhatsApp par bhejein", "no WhatsApp until a report exists");
  await mustNot(page, "Public link copy", "no copy link until a report exists");
  await mustNot(page, "Public maloomati page kholen", "no public page until a report exists");

  const nameBox = await page.evaluateHandle(() => {
    const labels = [...document.querySelectorAll("label")];
    const row = labels.find((el) => (el.textContent || "").includes("Naam"));
    return row?.querySelector("input") || null;
  });
  const nameEl = nameBox.asElement();
  if (!nameEl) throw new Error("Person name missing");
  await nameEl.type("Ahmed Malik", { delay: 12 });
  const phoneBox = await page.evaluateHandle(() => {
    const labels = [...document.querySelectorAll("label")];
    const row = labels.find((el) => (el.textContent || "").includes("WhatsApp number"));
    return row?.querySelector("input") || null;
  });
  const phoneEl = phoneBox.asElement();
  if (!phoneEl) throw new Error("Person phone missing");
  await phoneEl.type("03001234567", { delay: 10 });
  await clickContains(page, "Is shakhs ko shamil karein");
  await delay(300);
  await must(page, "Ahmed Malik", "person saved");
  await must(page, "Kharidar", "person role, not a pipeline stage");
  await mustNot(page, "Yeh page WhatsApp karein", "no person WhatsApp until a public page exists");
  await must(page, "WhatsApp par bhejein", "dealer contact can be shared on WhatsApp");
  const contactWa = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find((el) =>
      (el.textContent || "").includes("WhatsApp par bhejein"),
    );
    return a?.getAttribute("href") || "";
  });
  if (!contactWa.startsWith("https://wa.me/")) throw new Error("Dealer contact is not official wa.me");
  if (!decodeURIComponent(contactWa).includes("Ahmed Malik")) throw new Error("Dealer contact missing typed name");
  if (!decodeURIComponent(contactWa).includes("WhatsApp se nahi kheencha")) {
    throw new Error("Dealer contact must say the number was not scraped");
  }

  await setDate(page, 0, "2026-09-15");
  await clickContains(page, "Kaghazat dekhein");
  await clickContains(page, "Daurah mehfooz karein");
  await delay(300);
  await must(page, "2026-09-15", "visit date saved");
  await must(page, "Kaghazat dekhein", "visit purpose saved");
  const visitWa = await page.evaluate(() => {
    const links = [...document.querySelectorAll("a")].filter((el) =>
      (el.getAttribute("href") || "").startsWith("https://wa.me/"),
    );
    return links.map((el) => decodeURIComponent(el.getAttribute("href") || "")).join("\n");
  });
  if (!visitWa.includes("Tasdeeq ka daura")) throw new Error("Visit missing WhatsApp appointment text");
  if (!visitWa.includes("2026-09-15")) throw new Error("Visit WhatsApp missing date");

  const follow = await page.$('input[placeholder="Maslan Arazi se fard"]');
  if (!follow) throw new Error("Follow-up field missing");
  await follow.type("Arazi se fard mangni hai", { delay: 10 });
  await setDate(page, 1, "2026-09-20");
  await clickContains(page, "Follow-up mehfooz karein");
  await delay(300);
  await must(page, "Arazi se fard mangni hai", "follow-up saved");
  await must(page, "2026-09-20", "follow-up due saved");

  const workspace = await body(page);
  if (/lead pipeline|kanban|commission|conversion funnel|sales pipeline/i.test(workspace)) {
    throw new Error("Workspace looks like a generic CRM");
  }

  await clickContains(page, "Due-diligence report banayein");
  await page.waitForFunction(() => location.pathname.startsWith("/check"), { timeout: 10000 });
  await delay(700);
  await must(page, "Jaedad ki qisam kya hai", "wizard starts at kind, not a CRM form");
  const wizard = await body(page);
  if (wizard.includes("Aap kya karna chahte hain") && !wizard.includes("Jaedad ki qisam kya hai")) {
    throw new Error("Dealer check still on intent screen");
  }
  if (!page.url().includes("page=")) throw new Error("Dealer check missing page= query");
  if (!page.url().includes("intent=sell")) throw new Error("Dealer check missing sell intent");

  await page.goto(`${origin}/dealer`, { waitUntil: "domcontentloaded" });
  await delay(500);
  const importBox = await page.$("textarea.field");
  if (!importBox) throw new Error("Import box missing");
  await importBox.click({ clickCount: 3 });
  await importBox.type("Sahiwal, Chak 42, khasra 12/4, 4 kanal\nLahore, DHA Phase 6, 412, 10 marla, 2.5 crore", {
    delay: 8,
  });
  await clickContains(page, "Maloomati pages banayein");
  await delay(400);
  await must(page, "Pages shamil hue", "import count");
  await must(page, "Chak 42", "khasra import");
  await must(page, "DHA Phase 6", "priced import");
  await must(page, "2.5 crore", "imported asking price kept");

  await clickContains(page, "Chak 42");
  await page.waitForFunction(() => /\/dealer\/[A-Za-z0-9_-]+/.test(location.pathname), { timeout: 10000 });
  await delay(400);
  await must(page, "Khasra 12/4", "imported khasra on workspace");
  await must(page, "Abhi report nahi", "imported page has no invented report");
  const khasraPage = await body(page);
  if (/2\.5 crore|1\.8 crore/.test(khasraPage)) {
    throw new Error("Imported khasra page picked up another row's price");
  }

  await page.goto(`${origin}/dealer`, { waitUntil: "domcontentloaded" });
  await delay(400);
  await clickContains(page, "Sample maloomati page dekhein");
  await page.waitForFunction(() => location.pathname.includes("/r/ex-urban"), { timeout: 10000 });
  await delay(600);
  await must(page, "qanooni taur par verified nahi", "sample is not legally verified");
  await must(page, "Verified", "sample still shows provenance label");

  await page.goto(`${origin}/how`, { waitUntil: "domcontentloaded" });
  await delay(400);
  await must(page, "Dealer mode maloomati page banata hai, CRM nahi", "how page");

  await page.goto(`${origin}/dealer`, { waitUntil: "domcontentloaded" });
  await delay(400);
  await clickContains(page, "EN");
  await delay(400);
  await must(page, "Create a trustworthy property information page.", "English main job");
  await must(page, "This is not a CRM, lead pipeline, or listing board", "English not CRM");

  console.log(
    "Dealer smoke passed: add page, people, visit, follow-up, report wizard, import without invented prices, sample, English",
  );
} catch (err) {
  console.error("DEALER SMOKE FAILED:", err instanceof Error ? err.message : String(err));
  try {
    await page.screenshot({ path: path.join(process.cwd(), "data", "dealer-smoke-fail.png"), fullPage: true });
  } catch {
    /* ignore */
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}
