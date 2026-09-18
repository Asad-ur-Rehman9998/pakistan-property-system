import puppeteer from "puppeteer-core";
import path from "node:path";
import os from "node:os";
import { writeFileSync } from "node:fs";

const origin = process.env.E2E_URL || "http://localhost:3000";
const chrome =
  process.env.CHROME ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function clickContains(page, text) {
  let lastErr = null;
  for (let i = 0; i < 4; i += 1) {
    const handle = await page.evaluateHandle((needle) => {
      const nodes = [...document.querySelectorAll("button, a")];
      const matches = nodes.filter((el) =>
        (el.textContent || "").replace(/\s+/g, " ").includes(needle),
      );
      return (
        matches.find((el) => el.getAttribute("aria-pressed") !== null) || matches[0] || null
      );
    }, text);
    const el = handle.asElement();
    if (!el) throw new Error(`Could not click: ${text}`);
    try {
      await el.evaluate((node) => node.scrollIntoView({ block: "center", inline: "nearest" }));
      await delay(150);
      await el.click({ delay: 40 });
      await delay(500);
      return;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("detached") && !msg.includes("not visible")) throw err;
      await delay(250);
    }
  }
  throw lastErr ?? new Error(`Could not click: ${text}`);
}

async function clickPrimary(page) {
  let lastErr = null;
  for (let i = 0; i < 4; i += 1) {
    const handle = await page.evaluateHandle(() => {
      const buttons = [...document.querySelectorAll("button")];
      return buttons.find((b) => b.className.includes("btn-primary") && !b.disabled) || null;
    });
    const el = handle.asElement();
    if (!el) {
      await delay(300);
      lastErr = new Error("Primary continue button missing or disabled");
      continue;
    }
    try {
      await el.evaluate((node) => node.scrollIntoView({ block: "center" }));
      await el.click({ delay: 40 });
      await delay(600);
      return;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("detached")) throw err;
      await delay(250);
    }
  }
  throw lastErr ?? new Error("Primary continue button missing or disabled");
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function writeE2eJpeg(page) {
  const b64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#c4c4c4";
      ctx.fillRect(0, 0, 16, 16);
    }
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1] || "";
  });
  if (!b64) throw new Error("Could not encode a paper photo");
  const file = path.join(os.tmpdir(), "pc-e2e-paper.jpg");
  writeFileSync(file, Buffer.from(b64, "base64"));
  return file;
}

async function attachJpeg(page) {
  const file = await writeE2eJpeg(page);
  await page.waitForSelector('input[type="file"]', { timeout: 15000 });
  const input = await page.$('input[type="file"]');
  if (!input) throw new Error("file input missing");
  await input.uploadFile(file);
  await delay(1500);
}

async function visible(page, text) {
  return page.evaluate((needle) => {
    return (document.body?.innerText || "").includes(needle);
  }, text);
}

async function mustSee(page, text, where) {
  const ok = await visible(page, text);
  if (!ok) throw new Error(`Missing on ${where}: ${text}`);
}

async function waitText(page, text, where, timeout = 45000) {
  try {
    await page.waitForFunction(
      (needle) => (document.body?.innerText || "").includes(needle),
      { timeout },
      text,
    );
  } catch {
    const url = page.url();
    const body = await pageText(page);
    throw new Error(`Missing on ${where} (${url}): ${text}\n${body.slice(0, 360)}`);
  }
}

async function pageText(page) {
  return page.evaluate(() => document.body?.innerText || "");
}

async function gotoApp(page, url, needle, where) {
  let lastErr = null;
  for (let i = 0; i < 5; i += 1) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await delay(400);
    if (await visible(page, needle)) return;
    if (await visible(page, "Jo check is phone par save hai")) {
      lastErr = new Error(`Offline shell on ${where}`);
      await delay(1200);
      continue;
    }
    try {
      await waitText(page, needle, where, 45000);
      return;
    } catch (err) {
      lastErr = err;
      await delay(800);
    }
  }
  if (lastErr) throw lastErr;
  await waitText(page, needle, where);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const failures = [];
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });

try {
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30000 });
  await delay(800);
  await mustSee(page, "PropertyCheck", "home");
  await mustSee(page, "Property khareedne se pehle check karain", "home tagline");
  await mustSee(page, "Property check karein", "home check CTA");
  await mustSee(page, "Token dene se pehle", "home token CTA");
  await mustSee(page, "Main property dealer hoon", "home dealer CTA");
  await mustSee(page, "Sirf samajhna hai", "home understand CTA");
  await mustSee(page, "Urdu", "home language Urdu");
  await mustSee(page, "Roman Urdu", "home language Roman Urdu");
  await mustSee(page, "English", "home language English");
  await mustSee(page, "Mehman ki tarah shuru karein", "home guest entry");
  await mustSee(page, "Account nahi chahiye", "home no account");
  await mustSee(page, "Kam data", "home low-bandwidth toggle");
  await mustSee(page, "Asani", "home accessibility");
  await mustSee(page, "Zaroori nahi", "home voice optional");
  await mustSee(page, "Mujhe 5 marla ghar check karna hai.", "home voice example");
  await mustSee(page, "chatbot nahi", "home voice not a chatbot");
  await mustSee(page, "Privacy / kaghazat", "home privacy");
  await mustSee(page, "Aam Pakistani", "home differentiator");
  await mustSee(page, "zyada property listings par nahi tikta", "home not more listings");
  await mustSee(page, "Dehi users", "home rural users");
  await mustSee(page, "Pehli dafa kharidne wale", "home first-time buyers");
  await mustSee(page, "Bahar rehne wale Pakistani", "home overseas");
  await mustSee(page, "Chhote dealer", "home small dealers");
  await mustSee(page, "Kam digital samajh", "home low digital literacy");
  await mustSee(page, "WhatsApp par kaam", "home WhatsApp users");
  await mustSee(page, "kaghazat asani se nahi parh sakte", "home papers hard to read");

  const HOME_MUST = [
    "Property check karein",
    "Token dene se pehle",
    "Main property dealer hoon",
    "Sirf samajhna hai",
    "Kam data",
    "Asani",
    "Aam Pakistani",
  ];
  for (const width of [360, 390, 768, 1280, 1440]) {
    const height = width < 768 ? 800 : width < 1280 ? 1024 : 900;
    await page.setViewport({ width, height, isMobile: width < 768 });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await delay(500);
    if (width === 360) {
      await clickContains(page, "Roman");
      await delay(300);
    }
    for (const text of HOME_MUST) {
      await mustSee(page, text, `home ${width}px`);
    }
    const overflowHome = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    if (overflowHome) throw new Error(`Horizontal overflow on home at ${width}px`);

    await page.goto(`${origin}/check`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        const hasIntent = text.includes("Token dena") || text.includes("Pay token") || text.includes("ٹوکن");
        const hasPrimary = [...document.querySelectorAll("button")].some((b) =>
          String(b.className).includes("btn-primary"),
        );
        return hasIntent && hasPrimary;
      },
      { timeout: 30000 },
    );
    await delay(500);
    const overflowCheck = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    if (overflowCheck) throw new Error(`Horizontal overflow on /check at ${width}px`);
    if (width < 768) {
      let continueClear = { ok: false, why: "pending" };
      for (let attempt = 0; attempt < 6; attempt += 1) {
        continueClear = await page.evaluate(() => {
          const nav = document.querySelector("nav.fixed");
          const btn = [...document.querySelectorAll("button")].find((b) => {
            const cls = typeof b.className === "string" ? b.className : String(b.className);
            return cls.includes("btn-primary");
          });
          if (!btn || !nav) return { ok: false, why: !btn ? "no-btn" : "no-nav" };
          btn.scrollIntoView({ block: "center" });
          const br = btn.getBoundingClientRect();
          const nr = nav.getBoundingClientRect();
          return {
            ok: br.width > 0 && br.bottom <= nr.top + 8,
            brBottom: Math.round(br.bottom),
            nrTop: Math.round(nr.top),
            text: (btn.textContent || "").trim(),
          };
        });
        if (continueClear.ok) break;
        await delay(400);
      }
      if (!continueClear.ok) {
        throw new Error(`Continue button covered by bottom nav at ${width}px ${JSON.stringify(continueClear)}`);
      }
    }
  }
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await delay(600);

  await page.goto(`${origin}/admin`, { waitUntil: "domcontentloaded" });
  await delay(500);
  await clickContains(page, "Roman");
  await delay(400);
  await mustSee(page, "Staff desk", "admin title");
  await mustSee(page, "Har admin ko unlimited access nahi", "admin not unlimited");
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await delay(600);
  await mustSee(page, "Property check karein", "home check CTA after admin");

  await page.goto(`${origin}/privacy`, { waitUntil: "domcontentloaded" });
  await delay(500);
  await clickContains(page, "Roman");
  await delay(400);
  await mustSee(page, "Upload hue kaghazat default public nahi", "privacy never public");
  await mustSee(page, "Bina account check kar sakte hain", "privacy guest check");
  await mustSee(page, "check shuru karne ke liye nahi chahiye", "privacy no login wall");
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await delay(600);

  await clickContains(page, "Token dene se pehle");
  await waitText(page, "Bechne wale ki shanakht", "token workflow seller identity");
  await mustSee(page, "Bechne wale ki shanakht", "token workflow seller identity");
  await mustSee(page, "Farokht ka muahida", "token workflow sale agreement");
  await mustSee(page, "Yeh checklist shuru karein", "token workflow start");
  await mustSee(page, "WhatsApp par bhejein", "token checklist WhatsApp share");
  await mustSee(page, "wa.me", "token official WhatsApp");
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await delay(600);

  await clickContains(page, "Property check karein");
  await waitText(page, "Token dena", "guest check intent");
  await mustSee(page, "Mehman ki tarah shuru karein", "guest check, no account");
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await delay(600);

  await clickContains(page, "Sirf samajhna hai");
  await waitText(page, "Kaun se kaghazat mangein", "how problem 1");
  await mustSee(page, "Verified", "how page labels");
  await mustSee(page, "system-detected", "how page labels");
  await mustSee(page, "Kaun se kaghazat mangein", "how problem 1");
  await mustSee(page, "Token se pehle kya likhein", "how problem 8");
  await mustSee(page, "marla", "how pakistan-first units");
  await mustSee(page, "crore", "how pakistan-first money");
  await mustSee(page, "saste Android", "how village access");
  await mustSee(page, "Qeematein gharhte nahi", "how never invent prices");
  await mustSee(page, "Yeh ab bhi mangi hai, farokht nahi", "how asking is not a sale");
  await mustSee(page, "Mumkina naqal mushabihat hai, ilzam nahi", "how duplicates are not accusations");
  await mustSee(page, "fraud ka ilzam nahi", "how duplicates never accuse fraud");
  await mustSee(page, "Dealer mode maloomati page banata hai, CRM nahi", "how dealer is not a CRM");
  await mustSee(page, "Har jaedad ki saada shareable report", "how shareable report");
  await mustSee(page, "qanooni certificate nahi", "how report is not a legal certificate");
  await mustSee(page, "English, Urdu, Roman Urdu — qanooni alfaaz rakhe gaye", "how three languages");
  await mustSee(page, "title deed ya lot number nahi banate", "how terms are not machine-translated");
  await mustSee(page, "Awaz se check — zaroori nahi", "how voice optional");
  await mustSee(page, "Mic optional hai", "how voice mic optional");
  await mustSee(page, "chatbot nahi", "how voice not a chatbot");
  await mustSee(page, "Har zaroori kaam WhatsApp par bhejein", "how whatsapp-first");
  await mustSee(page, "wa.me", "how official wa.me");
  await mustSee(page, "scrape nahi", "how never scrape chats");
  await mustSee(page, "Dehi / kam data mode saste Android ke liye", "how rural mode");
  await mustSee(page, "Sasta Android", "how cheap Android");
  await mustSee(page, "SMS fallback", "how SMS fallback");
  await mustSee(page, "Har shakhs asani se use kar sake", "how accessibility");
  await mustSee(page, "RTL Urdu", "how RTL Urdu");
  await mustSee(page, "Kam harkat", "how reduced motion");
  await mustSee(page, "Kaghazat sensitive hain — public nahi", "how security");
  await mustSee(page, "signed link", "how signed urls");
  await mustSee(page, "2FA", "how professional 2FA");
  await mustSee(page, "Staff desk alag permissions — unlimited nahi", "how admin permissions");
  await mustSee(page, "Owner ke siwa unlimited nahi", "how admin not unlimited");
  await mustSee(page, "Postgres normalized tables — kaghazat nahi", "how postgres schema");
  await mustSee(page, "LLM evidence explain kar sakta hai — ghadta nahi", "how llm explains only");
  await mustSee(page, "I don't have enough information to determine this.", "how insufficient phrase");
  await mustSee(page, "App ko language model zaroori nahi", "how app not llm dependent");
  await mustSee(page, "Serious UI — trust, wazeh, tez", "how professional UI");
  await mustSee(page, "overloaded dashboard nahi", "how no dashboard");
  await mustSee(page, "360px", "how 360 through desktop");
  await mustSee(page, "Char home CTA", "how four home CTAs stay");
  await mustSee(page, "Char plans — qeemat config se, code se nahi", "how configurable plans");
  await mustSee(page, "basic property check", "how free basic check");
  await mustSee(page, "mahana subscription", "how dealer monthly");
  await mustSee(page, "code se nahi", "how prices not in code");
  await mustSee(page, "Har report yeh wazeh kehti hai", "how legal disclaimer");
  await mustSee(page, "qanooni mashwara", "how not legal advice");
  await mustSee(page, "title certification", "how not title certification");
  await mustSee(page, "ownership certification", "how not ownership certification");
  await mustSee(page, "ehl Pakistani qanooni pesha war", "how draft legal wording");
  await mustSee(page, "Jaali sarkari API nahi", "how no fake government APIs");
  await mustSee(page, "Official verification required.", "how official verification required");
  await mustSee(page, "Land record", "how no land-record API");
  await mustSee(page, "Farq listings nahi — samajh hai", "how differentiator");
  await mustSee(page, "zyada property listings par nahi tikta", "how not more listings");
  await mustSee(page, "aam Pakistani", "how ordinary Pakistanis");
  await mustSee(page, "bahar rehne wale Pakistani", "how overseas");
  await mustSee(page, "chhote dealer", "how small dealers");
  await mustSee(page, "Bahar se kharidari — raasta, qanooni mohr nahi", "how overseas mode");
  await mustSee(page, "mukhtarnama ya shanakht ki tasdeeq nahi", "how overseas not certified poa");
  await mustSee(page, "authorized representative", "how overseas representative stage");
  await mustSee(page, "Offline-first — form bharo, local save, phir sync", "how offline-first");
  await mustSee(page, "Saved on this device", "how saved on this device");
  await mustSee(page, "chupke se nahi gayab", "how never silently lose");
  await mustSee(page, "Ghalti — technical nahi", "how error handling");
  await mustSee(page, "Something went wrong. Your information has been saved. Please try again.", "how safe error copy");
  await mustSee(page, "audit log", "how errors go to audit");
  await mustSee(page, "Privacy-conscious analytics — ginti, log nahi", "how analytics");
  await mustSee(page, "property checks started", "how analytics started");
  await mustSee(page, "drop-off points", "how analytics drop-off");
  await mustSee(page, "Google Analytics ya teesra tracker nahi", "how no third-party analytics");
  await mustSee(page, "CNIC", "how analytics no cnic");
  await mustSee(page, "CNIC last-4", "how cnic last4 only");
  await mustSee(page, "17 phases — hazaron lines ek saath nahi", "how development process");
  await mustSee(page, "thousands of lines", "how no dump");
  await mustSee(page, "PHASE 1", "how inspect first");
  await mustSee(page, "folder structure", "how architectures");
  await mustSee(page, "Next.js PWA ko Vite par nahi likhte", "how stay next");
  await mustSee(page, "Guest check ke liye account zaroori nahi", "how guest still works");
  await mustSee(page, "Tests — unit, integration, do journeys", "how testing");
  await mustSee(page, "risk calculations", "how unit risk");
  await mustSee(page, "Check Property", "how customer journey");
  await mustSee(page, "Share with Customer", "how dealer journey");
  await mustSee(page, "Demo data farzi hai — wazeh label", "how demo data");
  await mustSee(page, "DEMO DATA — NOT A REAL PROPERTY", "how demo label");
  await mustSee(page, "Rs. 2.40 Crore", "how demo price");
  await mustSee(page, "Demo Property — DHA Phase 6, 5 Marla, Rs. 2.40 Crore", "how demo example link");
  await mustSee(page, "Code quality — SOLID, DRY, alag layers", "how code quality");
  await mustSee(page, "SOLID aur DRY", "how solid dry");
  await mustSee(page, "proper serializers", "how serializers");
  await mustSee(page, "environment variables", "how env vars");
  await mustSee(page, "No hardcoded secrets", "how no hardcoded secrets");
  await mustSee(page, "ek component ya ek file mein nahi", "how no monolith file");
  await mustSee(page, "Guest check ke liye account zaroori nahi", "how quality guest still works");
  await mustSee(page, "Environment — sirf .env.example git mein", "how environment");
  await mustSee(page, "Never commit .env", "how never commit env");
  await mustSee(page, "API keys", "how no api keys in git");
  await mustSee(page, "passwords", "how no passwords in git");
  await mustSee(page, "secret keys", "how no secret keys in git");
  await mustSee(page, "database credentials", "how no db credentials in git");
  await mustSee(page, "private tokens", "how no private tokens in git");
  await mustSee(page, "SESSION_SECRET", "how session secret from env");
  await mustSee(page, "Final product standard — pesh karne layak, student CRUD nahi", "how final product");
  await mustSee(page, "Pakistani property dealers", "how presentable to dealers");
  await mustSee(page, "buyers", "how presentable to buyers");
  await mustSee(page, "developers", "how presentable to developers");
  await mustSee(page, "banks", "how presentable to banks");
  await mustSee(page, "legal professionals", "how presentable to legal");
  await mustSee(page, "investors", "how presentable to investors");
  await mustSee(page, "government/authorized verification partners", "how presentable to gov partners");
  await mustSee(page, "overseas Pakistanis", "how presentable to overseas");
  await mustSee(page, "Student CRUD project nahi", "how not student crud");
  await mustSee(page, "AI-generated dashboard nahi", "how not ai dashboard");
  await mustSee(page, "Guest check ke liye account zaroori nahi", "how final guest still works");
  await mustSee(page, "Sab se ahem qaidah — random features nahi", "how most important rule");
  await mustSee(page, "Do not add random features simply to make the application look large", "how no random features");
  await mustSee(page, "safer", "how safer");
  await mustSee(page, "easier", "how easier");
  await mustSee(page, "clearer", "how clearer");
  await mustSee(page, "more accessible", "how more accessible");
  await mustSee(page, "If no: do not build it", "how if no do not build");
  await mustSee(page, "START NOW — pehle dekho, phir banao", "how start now");
  await mustSee(page, "Do not start coding immediately", "how no immediate coding");
  await mustSee(page, "database ERD", "how erd");
  await mustSee(page, "incremental build", "how incremental");
  await mustSee(page, "accessibility", "how a11y gate");
  await mustSee(page, "portfolio website nahi", "how not portfolio");
  await page.goto(`${origin}/this-page-does-not-exist`, { waitUntil: "domcontentloaded" });
  await delay(400);
  const missingPage = await pageText(page);
  if (/TypeError|500 Internal Server Error/i.test(missingPage)) {
    throw new Error("technical error leaked on a missing page");
  }
  await page.goto(`${origin}/plans`, { waitUntil: "domcontentloaded" });
  await waitText(page, "Muft customer", "plans free");
  await mustSee(page, "Premium customer", "plans premium");
  await mustSee(page, "Dealer", "plans dealer");
  await mustSee(page, "Professional", "plans professional");
  await mustSee(page, "Qeemat staff config mein set karta hai", "plans price from config");
  await mustSee(page, "Account nahi chahiye", "plans guest still starts");
  const plansBody = await pageText(page);
  if (/\b(rs\.?\s*\d|pkr\s*\d{2,}|\$\d)/i.test(plansBody)) {
    throw new Error("Plans page hardcoded a price");
  }
  await page.goto(`${origin}/review`, { waitUntil: "domcontentloaded" });
  await delay(500);
  await mustSee(page, "Professional plan", "review inbox gated");

  await page.goto(`${origin}/dealer`, { waitUntil: "domcontentloaded" });
  await delay(600);
  await mustSee(page, "CRM", "dealer not a CRM");
  await mustSee(page, "Bharosemand property maloomati page banayein", "dealer main job");
  await mustSee(page, "Yeh CRM, lead pipeline ya listing board nahi", "dealer not a pipeline");
  await mustSee(page, "Chhote dealer", "dealer small dealers");
  await mustSee(page, "zyada property listings nahi", "dealer not more listings");
  await mustSee(page, "Properties import karein", "dealer import");
  await mustSee(page, "Property check karein", "dealer guest check");
  const importBox = await page.$("textarea.field");
  if (!importBox) throw new Error("Dealer import box missing");
  await importBox.click({ clickCount: 3 });
  await importBox.type("Lahore, DHA Phase 6, 412, 10 marla, 2.5 crore", { delay: 10 });
  await clickContains(page, "Maloomati pages banayein");
  await delay(400);
  await mustSee(page, "Pages shamil hue", "dealer import count");
  await mustSee(page, "DHA Phase 6", "dealer imported page");
  await mustSee(page, "2.5 crore", "dealer imported asking price");
  await clickContains(page, "DHA Phase 6");
  await page.waitForFunction(() => /\/dealer\/[A-Za-z0-9_-]+/.test(location.pathname), { timeout: 30000 });
  await delay(400);
  await mustSee(page, "Bharosemand property maloomati page banayein", "dealer workspace job");
  await mustSee(page, "Abhi report nahi", "dealer no report yet");
  await mustSee(page, "Due-diligence report banayein", "dealer create report");
  await mustSee(page, "Is platform se sarkari tasdeeq: 0", "dealer official verification is zero");
  await mustSee(page, "Jinhain yeh page chahiye", "dealer people on the page");
  await mustSee(page, "Tasdeeq ke daure", "dealer visits");
  await mustSee(page, "Follow-up", "dealer follow-ups");
  await mustSee(page, "Is page ke kaghazat", "dealer documents");
  await mustSee(page, "Pehle check chalayen", "dealer public link waits for report");
  const nameBox = await page.evaluateHandle(() => {
    const labels = [...document.querySelectorAll("label")];
    const row = labels.find((el) => (el.textContent || "").includes("Naam"));
    return row?.querySelector("input") || null;
  });
  const nameEl = nameBox.asElement();
  if (!nameEl) throw new Error("Dealer person name missing");
  await nameEl.type("Ahmed Buyer", { delay: 15 });
  await clickContains(page, "Is shakhs ko shamil karein");
  await delay(300);
  await mustSee(page, "Ahmed Buyer", "dealer person saved on the page");
  await mustSee(page, "Kharidar", "dealer person role is not a lead stage");
  const dealerBody = await pageText(page);
  if (/lead pipeline|kanban|commission|conversion funnel/i.test(dealerBody)) {
    throw new Error("Dealer workspace looks like a generic CRM");
  }

  const dealerUrl = page.url();
  await clickContains(page, "Due-diligence report banayein");
  await page.waitForFunction(() => location.pathname.startsWith("/check"), { timeout: 20000 });
  await delay(400);
  if (!page.url().includes("intent=sell")) throw new Error("Dealer generate report did not open sell check");
  await mustSee(page, "Saved on this device", "dealer generate report opens check");
  await page.evaluate(() => localStorage.removeItem("pehle.draft"));
  await page.goto(dealerUrl, { waitUntil: "domcontentloaded" });
  await delay(500);
  const dealerPageId = new URL(dealerUrl).pathname.split("/").pop();
  await page.evaluate((id) => {
    const pages = JSON.parse(localStorage.getItem("pehle.dealerPages") || "[]");
    const row = pages.find((p) => p.id === id) || pages[0];
    if (!row) return;
    row.checkId = "e2edealer01ab";
    localStorage.setItem("pehle.dealerPages", JSON.stringify(pages));
    const check = {
      id: "e2edealer01ab",
      createdAt: "2026-08-31T00:00:00.000Z",
      shareKey: "aabbccddeeff00112233445566778899",
      answers: {
        intent: "sell",
        settlement: "urban",
        propertyKind: "plot",
        isSocietyFile: false,
        locationMethod: "manual",
        province: "punjab",
        city: "Lahore",
        district: "Lahore",
        area: "DHA Phase 6",
        tehsil: "",
        village: "",
        plotNumber: "412",
        khasraNumber: "",
        societyName: "DHA Phase 6",
        developerName: "",
        lat: "",
        lng: "",
        locationLabel: "DHA Phase 6, Lahore",
        hasDocuments: "yes",
        areaSize: "10",
        areaUnit: "marla",
        ownerNameOnPaper: "",
        counterparty: "owner",
        foundVia: "dealer",
        documents: {},
        flags: {},
        price: "2.5 crore",
        tokenAmount: "",
        notes: "",
        paperReads: [],
        tokenChecklist: {},
        buyerLocation: "pakistan",
        representativeName: "",
        representativeRelation: "",
        representativePoa: null,
      },
      report: {
        version: 1,
        createdAt: "2026-08-31T00:00:00.000Z",
        verdict: "wait",
        headline: { en: "Wait", ur: "انتظار", roman: "Intezar" },
        summary: { en: "Draft", ur: "مسودہ", roman: "Musawwada" },
        score: 0,
        hasOfficialVerification: false,
        provenance: { verified: 0, user_provided: 1, system_detected: 0, needs_verification: 1, unknown: 0 },
        infoStatus: {
          level: "verify",
          emoji: "",
          label: { en: "Needs verification", ur: "تصدیق درکار", roman: "Tasdeeq darkar" },
          meaning: { en: "Not official.", ur: "سرکاری نہیں۔", roman: "Sarkari nahi." },
        },
        known: [],
        missing: [],
        inconsistent: [],
        verify: [],
        questions: [],
      },
    };
    const checks = JSON.parse(localStorage.getItem("pehle.checks") || "[]");
    localStorage.setItem("pehle.checks", JSON.stringify([check, ...checks.filter((c) => c.id !== check.id)]));
  }, dealerPageId);
  await page.reload({ waitUntil: "domcontentloaded" });
  await delay(600);
  await mustSee(page, "Page WhatsApp par bhejein", "dealer share with customer");
  await mustSee(page, "Is page ke kaghazat", "dealer documents section");
  await mustSee(page, "Tasveer lagayen", "dealer upload control");
  await clickContains(page, "Kam data");
  await delay(400);
  const jpegFile = await writeE2eJpeg(page);
  const [chooser] = await Promise.all([
    page.waitForFileChooser({ timeout: 20000 }),
    page.click('input[type="file"]'),
  ]);
  await chooser.accept([jpegFile]);
  await delay(2000);
  await waitText(page, "Hatayen", "dealer uploaded document");
  await page.evaluate(() => {
    window.__opened = [];
    window.open = (url) => {
      window.__opened.push(String(url || ""));
      return null;
    };
  });
  await clickContains(page, "Page WhatsApp par bhejein");
  await delay(300);
  const opened = await page.evaluate(() => window.__opened || []);
  if (!opened.some((u) => String(u).includes("wa.me"))) {
    throw new Error("Dealer share did not open official WhatsApp");
  }
  for (let i = 0; i < 3; i += 1) {
    const t = await pageText(page);
    if (t.includes("Kam data: Auto") || t.includes("Kam data: Off")) break;
    await clickContains(page, "Kam data");
    await delay(200);
  }

  await page.goto(`${origin}/r/ex-demo`, { waitUntil: "domcontentloaded" });
  await waitText(page, "DEMO DATA — NOT A REAL PROPERTY", "featured demo label");
  await mustSee(page, "DHA Phase 6", "featured demo area");
  await mustSee(page, "5 Marla", "featured demo size");
  await mustSee(page, "2.4 crore", "featured demo price");
  await mustSee(page, "Sirf farzi namuna", "featured demo hint");

  await page.goto(`${origin}/r/ex-token`, { waitUntil: "domcontentloaded" });
  await waitText(page, "Abhi token na dein", "rushed-token example");
  await mustSee(page, "DEMO DATA — NOT A REAL PROPERTY", "token demo label");
  await mustSee(page, "Abhi token na dein", "rushed-token example");
  await mustSee(page, "Maloomat aur tasdeeq ki haisiyat", "info status title");
  await mustSee(page, "Zyada tawajjoh", "high attention status");
  await mustSee(page, "qanooni mehfooz score nahi", "not a safety score");
  await mustSee(page, "chhupa number nahi", "no hidden AI number");
  await mustSee(page, "Property due-diligence checklist", "token checklist title");
  await mustSee(page, "Bechne wale ki shanakht", "token checklist seller identity");
  await mustSee(page, "qanooni taur par verified nahi", "token report disclaimer");
  await mustSee(page, "qanooni mashwara", "token legal not advice");
  await mustSee(page, "title certification", "token legal not title");
  await mustSee(page, "ownership certification", "token legal not ownership");
  await mustSee(page, "ehl Pakistani qanooni pesha war", "token legal draft note");
  await mustSee(page, "Official verification required.", "token official verification required");
  await mustSee(page, "Verified", "token provenance");
  await mustSee(page, "Aap ne bataya", "token user-provided");
  await mustSee(page, "System ne pakra", "token system-detected");
  await mustSee(page, "Tasdeeq darkar", "token needs verification");
  await mustSee(page, "Namaloom", "token unknown");
  await mustSee(page, "Wakeel kab zaroori hai", "token lawyer section");
  await mustSee(page, "Token se pehle yeh likhein", "token record-before-money");
  await mustSee(page, "verified market qeemat", "token no fake market price");
  await mustSee(page, "1.5 crore", "token price in crore");
  await mustSee(page, "Marla", "token size in marla");
  await mustSee(page, "Qeemat ki samajh", "price intel title");
  await mustSee(page, "Mangi qeemat mukammal farokht ke barabar nahi", "asking vs sold");
  await mustSee(page, "Asal deal ki qeemat", "transaction price label");
  await mustSee(page, "Maani khez andaze ke liye kafi mustanad data nahi", "insufficient price data");
  await mustSee(page, "PKR 30 lakh", "asking per marla from 1.5 crore / 5 marla");
  await mustSee(page, "PKR 6 crore", "asking per kanal from 1.5 crore / 5 marla");
  await mustSee(page, "Milte julte ishtehar", "comparables stay labelled");
  await mustSee(page, "Purani mangi qeematein", "historical asking unavailable");
  await mustSee(page, "Kiraya ka andaza", "rental estimate unavailable");
  await mustSee(page, "Qeemat ki had", "price range unavailable");
  const tokenPriceBody = await pageText(page);
  if (/sold for|confirmed sale price of|market average/i.test(tokenPriceBody)) {
    throw new Error("Token report presented invented sale prices");
  }

  await page.goto(`${origin}/r/ex-rural`, { waitUntil: "domcontentloaded" });
  await waitText(page, "Abhi token na dein", "rural example");
  await mustSee(page, "Abhi token na dein", "rural example");
  await mustSee(page, "Khasra", "rural khasra identity");
  await mustSee(page, "Kanal", "rural kanal size");

  await page.goto(`${origin}/r/ex-urban`, { waitUntil: "domcontentloaded" });
  await delay(800);
  await mustSee(page, "DEMO DATA — NOT A REAL PROPERTY", "urban demo label");
  const urbanStop = await visible(page, "Abhi token na dein");
  const urbanWait = await visible(page, "Paise se pehle");
  const urbanCareful = await visible(page, "Check jari rakhein");
  if (!urbanStop && !urbanWait && !urbanCareful) {
    throw new Error("Urban example has no verdict headline");
  }
  await mustSee(page, "Qeemat ki samajh", "urban price intel");
  await mustSee(page, "PropertyCheck report", "urban shareable sheet");
  await mustSee(page, "qanooni certificate nahi", "urban sheet not a legal certificate");
  await mustSee(page, "qanooni mashwara", "urban legal not advice");
  await mustSee(page, "title certification", "urban legal not title");
  await mustSee(page, "QR code", "urban sheet QR");
  await mustSee(page, "Web report", "urban sheet web");
  await mustSee(page, "WhatsApp khulasa", "urban sheet WhatsApp");
  await mustSee(page, "Farokht / market had", "urban sheet does not invent a range");
  await mustSee(page, "Gharhi nahi", "urban sheet range not invented");
  await mustSee(page, "PKR 25 lakh", "urban asking per marla from 2.5 crore / 10 marla");
  await mustSee(page, "Maani khez andaze ke liye kafi mustanad data nahi", "urban no invented comparables");
  await mustSee(page, "Mumkina dohri listing", "urban possible duplicate");
  await mustSee(page, "3 doosri listings", "urban similar to 3 listings");
  await mustSee(page, "Listing A — WhatsApp dealer", "urban listing A");
  await mustSee(page, "Listing B — Facebook dealer", "urban listing B");
  await mustSee(page, "Listing C — online listing", "urban listing C");
  await mustSee(page, "Muqabla", "urban compare");
  await mustSee(page, "fraud ka ilzam nahi", "urban duplicate is not fraud");
  await clickContains(page, "Listing A — WhatsApp dealer");
  await page.waitForFunction(() => location.pathname.includes("/r/ex-dup-a"), { timeout: 15000 });
  await delay(500);
  await mustSee(page, "Mumkina dohri listing", "listing A also shows possible duplicates");
  await mustSee(page, "fraud ka ilzam nahi", "listing A does not accuse fraud");

  await page.goto(`${origin}/r/ex-urban/sheet`, { waitUntil: "domcontentloaded" });
  await delay(600);
  await mustSee(page, "PropertyCheck report", "standalone web sheet");
  await mustSee(page, "DHA Phase 6", "standalone location");
  await mustSee(page, "QR code", "standalone QR");
  await mustSee(page, "Print / PDF", "standalone PDF");
  await mustSee(page, "WhatsApp khulasa", "standalone WhatsApp");
  await mustSee(page, "qanooni certificate nahi", "standalone not a legal certificate");
  await mustSee(page, "Official verification required.", "standalone official verification required");
  await mustSee(page, "qanooni mashwara", "standalone legal not advice");
  await mustSee(page, "ownership certification", "standalone legal not ownership");

  await page.goto(`${origin}/glossary`, { waitUntil: "domcontentloaded" });
  await delay(600);
  await mustSee(page, "Fard", "glossary");
  await mustSee(page, "Istalahat ki lughat", "terminology dictionary");
  await mustSee(page, "title deed", "fard is not renamed title deed");
  await mustSee(page, "Yeh lafz rakhein", "keep this word");
  await mustSee(page, "Marla", "glossary marla");
  await mustSee(page, "Crore", "glossary crore");
  await mustSee(page, "Khasra", "glossary khasra kept");
  await mustSee(page, "Aks Shajra", "glossary aks shajra kept");

  await page.goto(`${origin}/offices`, { waitUntil: "domcontentloaded" });
  await delay(600);
  await mustSee(page, "PLRA", "offices");

  await gotoApp(page, `${origin}/overseas`, "Bahar se kharidari", "overseas title");
  await mustSee(page, "Main Pakistan mein jaedad kharid raha/rahi hoon magar ab bahar hoon.", "overseas lead");
  await mustSee(page, "Jaedad ki jagah", "overseas property location");
  await mustSee(page, "Kaghazat", "overseas documents");
  await mustSee(page, "Door se tasdeeq ka raasta", "overseas remote verification");
  await mustSee(page, "Pesha war jaiza", "overseas professional review");
  await mustSee(page, "Report", "overseas report stage");
  await mustSee(page, "Authorized representative", "overseas representative stage");
  await mustSee(page, "Faisla", "overseas decision");
  await mustSee(page, "mukhtarnama ya shanakht ki tasdeeq nahi", "overseas does not certify poa");
  await mustSee(page, "Official verification required", "overseas official verification required");
  await mustSee(page, "Mehman ki tarah shuru karein", "overseas guest still starts");
  const overseasBody = await pageText(page);
  if (/legally valid (power of attorney|mukhtarnama)/i.test(overseasBody)) {
    throw new Error("Overseas page claimed legal validity for POA");
  }

  await gotoApp(page, `${origin}/r/ex-overseas`, "Bahar wala raasta", "overseas example lane");
  await mustSee(page, "Authorized representative", "overseas example representative");
  await mustSee(page, "Official verification required", "overseas example official verification");
  await mustSee(page, "mukhtarnama ya shanakht ki tasdeeq nahi", "overseas example not certified poa");
  await mustSee(page, "Namzad numainda: Ali Khan", "overseas named representative finding");
  const overseasReport = await pageText(page);
  if (/source.{0,40}verified/i.test(overseasReport) && /legally valid/i.test(overseasReport)) {
    throw new Error("Overseas report mixed verified with legal validity");
  }

  await page.goto(`${origin}/check`, { waitUntil: "domcontentloaded" });
  await waitText(page, "Token dena", "wizard intent");
  await delay(400);
  await mustSee(page, "Saved on this device", "wizard saved on this device");
  for (let i = 0; i < 3; i += 1) {
    if (await visible(page, "Kam data: On")) break;
    await clickContains(page, "Kam data");
    await delay(200);
  }
  await page.setOfflineMode(true);
  await waitText(page, "Internet unavailable", "offline status");
  await mustSee(page, "Saved on this device", "offline still saved on this device");
  await page.setOfflineMode(false);
  await delay(400);
  await mustSee(page, "Roman", "global language switch on check");
  await mustSee(page, "EN", "global language English on check");
  await clickContains(page, "Token dena");
  await clickPrimary(page);
  await waitText(page, "Aap ab kahan hain", "buyer location after token");
  await clickContains(page, "Main Pakistan mein hoon");
  await clickPrimary(page);
  await mustSee(page, "Jaedad ki qisam kya hai", "property type question");
  await mustSee(page, "Ghar", "type house");
  await mustSee(page, "Apartment", "type apartment");
  await mustSee(page, "Plot", "type plot");
  await mustSee(page, "Commercial", "type commercial");
  await mustSee(page, "Zaraee zameen", "type agricultural");
  await mustSee(page, "Industrial", "type industrial");
  await clickContains(page, "Ghar");
  await clickPrimary(page);
  await clickContains(page, "Shehar / society");
  await clickPrimary(page);
  await mustSee(page, "Jaedad kahan hai", "location question");
  await mustSee(page, "Search", "location search");
  await mustSee(page, "Map", "location map");
  await mustSee(page, "Khud likhein", "location manual");
  await clickContains(page, "Khud likhein");
  await clickPrimary(page);
  for (let i = 0; i < 20; i++) {
    if (await visible(page, "Woh kitna mang rahe hain")) break;
    await clickPrimary(page);
  }
  await mustSee(page, "Woh kitna mang rahe hain", "asking price");
  await mustSee(page, "2.5 crore", "crore hint");
  await mustSee(page, "2,50,00,000", "indian grouping hint");
  const priceBox = await page.$("input.field");
  if (priceBox) {
    await priceBox.click({ clickCount: 3 });
    await priceBox.type("2.5 crore", { delay: 20 });
    await delay(300);
    await mustSee(page, "Rs. 2,50,00,000", "parsed grouped rupees");
    await mustSee(page, "2.5 crore", "parsed crore");
  }
  await clickPrimary(page);
  await waitText(page, "Kya aap ke paas property ke kaghazat hain", "has documents");
  await mustSee(page, "Haan", "has docs yes");
  await mustSee(page, "Nahi", "has docs no");
  await clickContains(page, "Haan");
  await clickPrimary(page);
  await waitText(page, "Apni property ki dastavez upload karein", "customer upload document");
  await attachJpeg(page);
  await waitText(page, "Hatayen", "customer uploaded photo");
  await clickPrimary(page);
  await waitText(page, "Phone ne kya padha, check karein", "customer review information");
  await mustSee(page, "sarkari check nahi", "review is not official verification");
  await clickPrimary(page);
  for (let i = 0; i < 20; i++) {
    if (await visible(page, "Pata nahi")) break;
    await clickPrimary(page);
  }
  await clickContains(page, "Pata nahi");
  let reachedReport = false;
  for (let i = 0; i < 60; i++) {
    const marked = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("button")];
      const mark = nodes.find((el) => (el.textContent || "").includes("Tasdeeq darkar"));
      if (!mark) return false;
      mark.click();
      return true;
    });
    if (marked) await delay(250);
    const label = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button")];
      const primary = buttons.find((b) => b.className.includes("btn-primary") && !b.disabled);
      return (primary?.textContent || "").replace(/\s+/g, " ").trim();
    });
    if (label.includes("Report dekhein") || label.includes("Due-diligence checklist dekhein")) {
      await clickPrimary(page);
      reachedReport = true;
      break;
    }
    await clickPrimary(page);
  }
  if (!reachedReport) throw new Error("Did not reach report step");
  await page.waitForFunction(() => location.pathname.startsWith("/r/"), { timeout: 30000 });
  await waitText(page, "Abhi token na dein", "generated report");
  await mustSee(page, "Property due-diligence checklist", "generated checklist");
  await mustSee(page, "qanooni taur par verified nahi", "generated disclaimer");
  await mustSee(page, "qanooni mashwara", "generated legal not advice");
  await mustSee(page, "title certification", "generated legal not title");
  await mustSee(page, "guarantee nahi", "generated legal no safety guarantee");
  await mustSee(page, "Official verification required.", "generated official verification required");
  await mustSee(page, "Verified", "generated provenance");
  await mustSee(page, "Tafseeli report Premium plan par hai", "generated premium gate");
  await mustSee(page, "Plans dekhein", "generated plans link");
  const generated = await pageText(page);
  if (!generated.includes("PKR 2.5 crore")) {
    throw new Error("Generated report missing typed asking price");
  }
  if (generated.includes("PKR 25 lakh")) {
    throw new Error("Invented per-marla on a report with no plot size");
  }
  if (!page.url().includes("/r/")) throw new Error("Did not land on a report URL");

  await clickContains(page, "اردو");
  await delay(400);
  await mustSee(page, "ابھی ٹوکن نہ دیں", "Urdu report");
  await mustSee(page, "آپ نے بتایا", "Urdu user-provided");
  await mustSee(page, "تصدیق درکار", "Urdu needs verification");
} catch (err) {
  failures.push(err instanceof Error ? err.message : String(err));
  try {
    await page.screenshot({ path: path.join(process.cwd(), "data", "ui-e2e-fail.png"), fullPage: true });
  } catch {
    /* ignore */
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error("UI E2E FAILED:\n" + failures.join("\n"));
  process.exit(1);
}

console.log("UI E2E passed: home, how, examples, provenance labels, wizard → stop report, Urdu switch");
