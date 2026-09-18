import type {
  CheckAnswers,
  DuplicateCandidate,
  DuplicateMatch,
  DuplicateReport,
  DuplicateSignal,
  DuplicateSignalId,
  Localized,
  PaperRead,
  RiskItem,
  SavedCheck,
} from "@/types/check";
import { areasCompare } from "@/lib/pakistan/area";
import { parsePkr } from "@/lib/pakistan/money";
import { fieldValue } from "@/lib/docai/extract";
import { hammingHex } from "@/lib/docai/imagePrint";
import { namesLikelySame, normalizeId } from "@/lib/docai/names";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

const DISCLAIMER = L(
  "Possible only. Several dealers may advertise the same plot. This is not a finding of fraud.",
  "صرف امکان۔ کئی ڈیلر ایک ہی پلاٹ اشتہار دے سکتے ہیں۔ یہ فراڈ کا الزام نہیں۔",
  "Sirf imkaan. Kai dealer aik hi plot ishtehar de sakte hain. Yeh fraud ka ilzam nahi.",
);

const NAMED_LABELS: Record<string, Localized> = {
  "ex-demo": L("Demo Property", "ڈیمو جائیداد", "Demo Property"),
  "ex-urban": L("City plot example", "شہری پلاٹ کی مثال", "Shehri plot ki misal"),
  "ex-rural": L("Village land example", "گاؤں کی زمین کی مثال", "Gaon ki zameen ki misal"),
  "ex-token": L("Rushed token example", "جلدی ٹوکن کی مثال", "Jaldi token ki misal"),
  "ex-papers": L("Papers that do not match", "کاغذات جو نہیں ملتے", "Kaghazat jo nahi milte"),
  "ex-overseas": L("Overseas buyer example", "بیرون ملک خریدار کی مثال", "Bahar se kharidari ki misal"),
  "ex-dup-a": L("Listing A — WhatsApp dealer", "لسٹنگ A — واٹس ایپ ڈیلر", "Listing A — WhatsApp dealer"),
  "ex-dup-b": L("Listing B — Facebook dealer", "لسٹنگ B — فیس بک ڈیلر", "Listing B — Facebook dealer"),
  "ex-dup-c": L("Listing C — online listing", "لسٹنگ C — آن لائن اشتہار", "Listing C — online listing"),
};

const STOP = new Set([
  "the",
  "and",
  "hai",
  "hain",
  "ki",
  "ka",
  "ke",
  "ko",
  "se",
  "mein",
  "for",
  "this",
  "that",
  "with",
  "plot",
  "file",
  "dealer",
  "token",
  "marla",
  "kanal",
]);

function signal(id: DuplicateSignalId, status: DuplicateSignal["status"], detail: Localized): DuplicateSignal {
  return { id, status, detail };
}

function fold(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/\bphase\b/g, "ph")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function samePlace(a: string, b: string): boolean {
  const na = fold(a);
  const nb = fold(b);
  if (na.length < 3 || nb.length < 3) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function normalizePlot(raw: string): string {
  return normalizeId(raw)
    .replace(/^(PLOT|FILE|NO|NUMBER|#)+/, "")
    .replace(/[^A-Z0-9/]/g, "");
}

export function phonesInText(raw: string): string[] {
  const hits = String(raw || "").match(/(?:\+92|0)?3\d{9}/g) ?? [];
  return [...new Set(hits.map((p) => p.replace(/\D/g, "").slice(-10)))];
}

function paperVal(reads: PaperRead[], key: Parameters<typeof fieldValue>[1]): string {
  return fieldValue(reads.flatMap((r) => r.fields), key) ?? "";
}

function plotOf(a: CheckAnswers): string {
  return normalizePlot(a.plotNumber || paperVal(a.paperReads ?? [], "plotNumber"));
}

function khasraOf(a: CheckAnswers): string {
  return normalizePlot(a.khasraNumber || paperVal(a.paperReads ?? [], "khasraNumber"));
}

function printsOf(a: CheckAnswers): string[] {
  return (a.paperReads ?? []).map((r) => r.imagePrint).filter((p): p is string => !!p && /^[0-9a-f]{16}$/i.test(p));
}

function tokens(raw: string): Set<string> {
  return new Set(
    fold(raw)
      .split(" ")
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const t of a) if (b.has(t)) hit += 1;
  return hit / (a.size + b.size - hit);
}

function km(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

function coords(a: CheckAnswers): { lat: number; lng: number } | null {
  const lat = Number(a.lat);
  const lng = Number(a.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function locationSignal(a: CheckAnswers, b: CheckAnswers): DuplicateSignal {
  const ca = coords(a);
  const cb = coords(b);
  if (ca && cb) {
    const d = km(ca.lat, ca.lng, cb.lat, cb.lng);
    if (d <= 0.15) {
      return signal("location", "match", L(`Map pins ${d.toFixed(2)} km apart.`, `نقشے کے پِن ${d.toFixed(2)} کلومیٹر دور۔`, `Map pins ${d.toFixed(2)} km door.`));
    }
  }
  const cityA = a.city.trim();
  const cityB = b.city.trim();
  const cityOk = cityA && cityB && samePlace(cityA, cityB);
  const societyOk =
    (a.societyName && b.societyName && samePlace(a.societyName, b.societyName)) ||
    (a.area && b.area && samePlace(a.area, b.area)) ||
    (a.societyName && b.area && samePlace(a.societyName, b.area)) ||
    (a.area && b.societyName && samePlace(a.area, b.societyName));
  const villageOk = a.village && b.village && samePlace(a.village, b.village);
  if (cityOk && (societyOk || villageOk)) {
    const place = a.societyName || a.area || a.village || a.city;
    return signal("location", "match", L(`Same place: ${place}, ${a.city}.`, `ایک جگہ: ${place}، ${a.city}۔`, `Ek jagah: ${place}, ${a.city}.`));
  }
  if (cityA && cityB && !samePlace(cityA, cityB)) {
    return signal("location", "differ", L(`Different cities: ${a.city} vs ${b.city}.`, `شہر الگ: ${a.city} بمقابلہ ${b.city}۔`, `Shehar alag: ${a.city} vs ${b.city}.`));
  }
  if (cityOk && a.societyName && b.societyName && !samePlace(a.societyName, b.societyName)) {
    return signal("location", "differ", L(`Same city, different society.`, `ایک شہر، الگ سوسائٹی۔`, `Ek shehar, alag society.`));
  }
  return signal(
    "location",
    "unknown",
    L("Not enough shared place detail to compare.", "جگہ کی مشترکہ تفصیل کافی نہیں۔", "Jagah ki mushtarka tafseel kafi nahi."),
  );
}

function plotSignal(a: CheckAnswers, b: CheckAnswers): DuplicateSignal {
  const pa = plotOf(a);
  const pb = plotOf(b);
  const ka = khasraOf(a);
  const kb = khasraOf(b);
  if (pa && pb && pa === pb) {
    return signal("plot", "match", L(`Plot / file ${pa} on both.`, `دونوں پر پلاٹ / فائل ${pa}۔`, `Dono par plot / file ${pa}.`));
  }
  if (ka && kb && ka === kb) {
    return signal("plot", "match", L(`Khasra ${ka} on both.`, `دونوں پر خسرہ ${ka}۔`, `Dono par khasra ${ka}.`));
  }
  if ((pa && pb && pa !== pb) || (ka && kb && ka !== kb)) {
    return signal("plot", "differ", L("Plot or khasra numbers are not the same.", "پلاٹ یا خسرہ ایک نہیں۔", "Plot ya khasra ek nahi."));
  }
  return signal("plot", "unknown", L("Plot / khasra missing on one or both sides.", "ایک یا دونوں طرف پلاٹ / خسرہ نہیں۔", "Ek ya dono taraf plot / khasra nahi."));
}

function imageSignal(a: CheckAnswers, b: CheckAnswers): DuplicateSignal {
  const pa = printsOf(a);
  const pb = printsOf(b);
  if (!pa.length || !pb.length) {
    return signal("images", "unknown", L("No comparable photo fingerprint yet.", "ابھی موازنے کے قابل فوٹو پرنٹ نہیں۔", "Abhi muwazne ke qabil photo print nahi."));
  }
  let best: number | null = null;
  for (const x of pa) {
    for (const y of pb) {
      const d = hammingHex(x, y);
      if (d == null) continue;
      if (best == null || d < best) best = d;
    }
  }
  if (best != null && best <= 10) {
    return signal("images", "match", L(`Photo fingerprints are close (distance ${best}).`, `فوٹو پرنٹ قریب ہیں (فاصلہ ${best})۔`, `Photo print qareeb hain (fasla ${best}).`));
  }
  if (best != null && best >= 18) {
    return signal("images", "differ", L("Photo fingerprints do not look the same.", "فوٹو پرنٹ ایک جیسے نہیں لگتے۔", "Photo print ek jese nahi lagte."));
  }
  return signal("images", "unknown", L("Photo fingerprints are inconclusive.", "فوٹو پرنٹ سے تعین نہیں۔", "Photo print se taeen nahi."));
}

function charSignal(a: CheckAnswers, b: CheckAnswers): DuplicateSignal {
  const kindOk = !!(a.propertyKind && b.propertyKind && a.propertyKind === b.propertyKind);
  const sizeA = a.areaSize && a.areaUnit ? `${a.areaSize} ${a.areaUnit}` : a.areaSize;
  const sizeB = b.areaSize && b.areaUnit ? `${b.areaSize} ${b.areaUnit}` : b.areaSize;
  const size = sizeA && sizeB ? areasCompare(sizeA, sizeB) : "undetermined";
  if (kindOk && size === "match") {
    return signal(
      "characteristics",
      "match",
      L(`${a.propertyKind}, ${sizeA}.`, `${a.propertyKind}، ${sizeA}۔`, `${a.propertyKind}, ${sizeA}.`),
    );
  }
  if ((a.propertyKind && b.propertyKind && a.propertyKind !== b.propertyKind) || size === "mismatch") {
    return signal("characteristics", "differ", L("Type or size is not the same.", "قسم یا رقبہ ایک نہیں۔", "Qism ya raqba ek nahi."));
  }
  return signal("characteristics", "unknown", L("Type or size is incomplete on one side.", "ایک طرف قسم یا رقبہ ادھورا ہے۔", "Ek taraf qism ya raqba adhura hai."));
}

function descSignal(a: CheckAnswers, b: CheckAnswers): DuplicateSignal {
  const ta = tokens(a.notes);
  const tb = tokens(b.notes);
  if (ta.size < 4 || tb.size < 4) {
    return signal("description", "unknown", L("Notes are too short to compare.", "نوٹ موازنے کے لیے چھوٹے ہیں۔", "Note muwazne ke liye chhote hain."));
  }
  const j = jaccard(ta, tb);
  if (j >= 0.3) {
    return signal("description", "match", L("Notes share several of the same words.", "نوٹ میں کئی ایک جیسے الفاظ ہیں۔", "Note mein kai ek jese alfaaz hain."));
  }
  if (j < 0.08) {
    return signal("description", "differ", L("Notes do not read as the same advert.", "نوٹ ایک ہی اشتہار نہیں لگتے۔", "Note ek hi ishtehar nahi lagte."));
  }
  return signal("description", "unknown", L("Notes overlap only weakly.", "نوٹ کم ملتے ہیں۔", "Note kam milte hain."));
}

function priceSignal(a: CheckAnswers, b: CheckAnswers): DuplicateSignal {
  const pa = parsePkr(a.price);
  const pb = parsePkr(b.price);
  if (!pa || !pb) {
    return signal("price", "unknown", L("Asking price missing on one or both sides.", "ایک یا دونوں طرف منگی قیمت نہیں۔", "Ek ya dono taraf mangi qeemat nahi."));
  }
  const gap = Math.abs(pa - pb) / Math.max(pa, pb);
  if (gap <= 0.2) {
    return signal("price", "match", L("Asking prices are close (not sale prices).", "منگی قیمتیں قریب ہیں (فروخت کی قیمت نہیں)۔", "Mangi qeematein qareeb hain (farokht ki qeemat nahi)."));
  }
  if (gap >= 0.45) {
    return signal("price", "differ", L("Asking prices are far apart.", "منگی قیمتیں بہت الگ ہیں۔", "Mangi qeematein bohat alag hain."));
  }
  return signal("price", "unknown", L("Asking prices differ, but not sharply.", "منگی قیمتیں الگ ہیں، تیز فرق نہیں۔", "Mangi qeematein alag hain, tez farq nahi."));
}

function contactSignal(a: CheckAnswers, b: CheckAnswers): DuplicateSignal {
  const phonesA = new Set([...phonesInText(a.notes), ...phonesInText(a.ownerNameOnPaper)]);
  const phonesB = new Set([...phonesInText(b.notes), ...phonesInText(b.ownerNameOnPaper)]);
  const sharedPhone = [...phonesA].find((p) => phonesB.has(p));
  if (sharedPhone) {
    return signal("contact", "match", L("Same phone number appears in the notes.", "نوٹ میں ایک ہی فون نمبر ہے۔", "Note mein ek hi phone number hai."));
  }
  const cnicA = paperVal(a.paperReads ?? [], "cnicLast4");
  const cnicB = paperVal(b.paperReads ?? [], "cnicLast4");
  if (cnicA && cnicB && cnicA === cnicB && cnicA.length >= 4) {
    return signal("contact", "match", L("CNIC last-4 matches (not a full CNIC).", "شناختی کارڈ کے آخری ۴ ہندسے ملتے ہیں (پورا نمبر نہیں)۔", "CNIC last-4 milte hain (poora number nahi)."));
  }
  if (namesLikelySame(a.ownerNameOnPaper, b.ownerNameOnPaper) && fold(a.ownerNameOnPaper).length >= 8) {
    return signal("contact", "match", L("Owner name on paper looks like the same person.", "کاغذ پر مالک کا نام ایک جیسا لگتا ہے۔", "Kaghaz par malik ka naam ek jesa lagta hai."));
  }
  if (phonesA.size && phonesB.size && !sharedPhone) {
    return signal("contact", "differ", L("Phone numbers in the notes are not the same.", "نوٹ کے فون نمبر ایک نہیں۔", "Note ke phone number ek nahi."));
  }
  return signal("contact", "unknown", L("No shared phone, CNIC last-4, or owner name to compare.", "موازنے کے لیے مشترکہ فون، CNIC last-4 یا مالک کا نام نہیں۔", "Muwazne ke liye mushtarka phone, CNIC last-4 ya malik ka naam nahi."));
}

function identityGate(signals: DuplicateSignal[]): boolean {
  const st = (id: DuplicateSignalId) => signals.find((s) => s.id === id)?.status;
  const loc = st("location") === "match";
  const plot = st("plot") === "match";
  const images = st("images") === "match";
  const contact = st("contact") === "match";
  if (plot && loc) return true;
  if (images && loc) return true;
  if (images && plot) return true;
  if (contact && plot && loc) return true;
  return false;
}

function scoreOf(signals: DuplicateSignal[]): number {
  const st = (id: DuplicateSignalId) => signals.find((s) => s.id === id)?.status;
  let n = 0;
  if (st("location") === "match") n += 2;
  if (st("plot") === "match") n += 4;
  if (st("images") === "match") n += 3;
  if (st("characteristics") === "match") n += 1;
  if (st("description") === "match") n += 1;
  if (st("price") === "match") n += 1;
  if (st("contact") === "match") n += 2;
  return n;
}

export function listingLabelFor(id: string, answers: CheckAnswers): Localized {
  if (NAMED_LABELS[id]) return NAMED_LABELS[id];
  const place = [answers.area, answers.city].filter(Boolean).join(", ") || "Saved check";
  const via = answers.foundVia ? ` · ${answers.foundVia}` : "";
  return L(`${place}${via}`, `${place}${via}`, `${place}${via}`);
}

export function candidateFromCheck(check: SavedCheck): DuplicateCandidate {
  return {
    id: check.id,
    href: `/r/${check.id}`,
    label: listingLabelFor(check.id, check.answers),
    answers: check.answers,
  };
}

export function comparePair(current: CheckAnswers, other: DuplicateCandidate): DuplicateMatch | null {
  if (!other.id) return null;
  const signals = [
    locationSignal(current, other.answers),
    plotSignal(current, other.answers),
    imageSignal(current, other.answers),
    charSignal(current, other.answers),
    descSignal(current, other.answers),
    priceSignal(current, other.answers),
    contactSignal(current, other.answers),
  ];
  if (!identityGate(signals)) return null;
  return {
    id: other.id,
    href: other.href || `/r/${other.id}`,
    label: other.label ?? listingLabelFor(other.id, other.answers),
    score: scoreOf(signals),
    signals,
    source: "system_detected",
  };
}

function emptySummary(compared: number): Localized {
  if (compared <= 0) {
    return L(
      "Not enough other listings or checks to compare.",
      "موازنے کے لیے کافی دیگر اشتہار یا چیک نہیں۔",
      "Muwazne ke liye kafi deegar ishtehar ya check nahi.",
    );
  }
  return L(
    `No possible duplicates among ${compared} other listings or checks. That does not prove this listing is unique.`,
    `${compared} دیگر اشتہار یا چیک میں ممکنہ نقل نہیں۔ اس سے ثابت نہیں کہ یہ اشتہار منفرد ہے۔`,
    `${compared} deegar ishtehar ya check mein mumkina naqal nahi. Is se sabit nahi ke yeh ishtehar munfarid hai.`,
  );
}

export function assessDuplicates(
  answers: CheckAnswers,
  opts: { selfId?: string; candidates?: DuplicateCandidate[] } = {},
): DuplicateReport {
  const selfId = opts.selfId ?? "";
  const pool = (opts.candidates ?? []).filter((c) => c.id && c.id !== selfId);
  const matches = pool
    .map((c) => comparePair(answers, c))
    .filter((m): m is DuplicateMatch => !!m)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  const n = matches.length;
  const summary =
    n === 0
      ? emptySummary(pool.length)
      : n === 1
        ? L(
            "This property appears similar to 1 other listing.",
            "یہ جائیداد ۱ دیگر اشتہار سے ملتی جلتی لگتی ہے۔",
            "Yeh jaedad 1 doosri listing se milti julti lagti hai.",
          )
        : L(
            `This property appears similar to ${n} other listings.`,
            `یہ جائیداد ${n} دیگر اشتہاروں سے ملتی جلتی لگتی ہے۔`,
            `Yeh jaedad ${n} doosri listings se milti julti lagti hai.`,
          );
  return { matches, comparedCount: pool.length, summary, disclaimer: DISCLAIMER };
}

export function duplicateRisks(report: DuplicateReport): RiskItem[] {
  if (!report.matches.length) return [];
  const n = report.matches.length;
  const names = report.matches.map((m) => m.label.en).join("; ");
  return [
    {
      id: "risk_possible_duplicate",
      lane: "suspicious_listing",
      attention: n >= 3 ? "high" : "medium",
      title: L("Possible duplicate listing", "ممکنہ دوہری لسٹنگ", "Mumkina dohri listing"),
      why: L(
        "The same plot can be advertised by more than one dealer. This is a possible match, not a finding of fraud. Requires verification.",
        "ایک پلاٹ ایک سے زیادہ ڈیلر اشتہار دے سکتے ہیں۔ یہ ممکنہ مشابہت ہے، فراڈ کا الزام نہیں۔ تصدیق درکار ہے۔",
        "Ek plot ek se zyada dealer ishtehar de sakte hain. Yeh mumkina mushabihat hai, fraud ka ilzam nahi. Tasdeeq darkar hai.",
      ),
      evidence: L(
        `Compared with ${report.comparedCount} other listings/checks. Possible matches: ${names}. Source: system-detected.`,
        `${report.comparedCount} دیگر اشتہار/چیک سے موازنہ۔ ممکنہ مشابہت: ${names}۔ ذریعہ: سسٹم۔`,
        `${report.comparedCount} deegar ishtehar/check se muwazna. Mumkina mushabihat: ${names}. Source: system-detected.`,
      ),
      doNow: L(
        "Open the other listings and compare plot, place, photos, and contact. Confirm the record at the society or revenue office. Do not assume a dealer is committing a crime.",
        "دیگر اشتہار کھولیں اور پلاٹ، جگہ، تصاویر اور رابطہ ملایں۔ سوسائٹی یا ریونیو دفتر سے ریکارڈ کی تصدیق کریں۔ ڈیلر پر جرم نہ تھوپیں۔",
        "Doosri listings kholen aur plot, jagah, tasveerein aur rabta milayen. Society ya revenue daftar se record ki tasdeeq karein. Dealer par jurm na thopen.",
      ),
      source: "system_detected",
    },
  ];
}
