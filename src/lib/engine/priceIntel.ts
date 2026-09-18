import type {
  AreaUnit,
  CheckAnswers,
  Localized,
  PriceIntelligence,
  PriceUnavailable,
  PriceUnitRate,
} from "@/types/check";
import { parseAreaPhrase, toKanal, toMarla, toSqft } from "@/lib/pakistan/area";
import { parsePkr } from "@/lib/pakistan/money";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

const INSUFFICIENT = L(
  "Insufficient reliable data for a meaningful estimate.",
  "معنی خیز اندازے کے لیے کافی مستند ڈیٹا نہیں۔",
  "Maani khez andaze ke liye kafi mustanad data nahi.",
);

function unavailable(): PriceUnavailable {
  return { available: false, message: INSUFFICIENT };
}

export function resolveArea(answers: CheckAnswers): { amount: number; unit: AreaUnit } | null {
  const fromPicker = Number(String(answers.areaSize || "").replace(/,/g, "").trim());
  if (Number.isFinite(fromPicker) && fromPicker > 0 && answers.areaUnit) {
    return { amount: fromPicker, unit: answers.areaUnit };
  }
  const parsed = parseAreaPhrase(answers.areaSize || "");
  if (parsed?.amount && parsed.unit) return { amount: parsed.amount, unit: parsed.unit };
  return null;
}

function rate(pkr: number, area: number, unit: PriceUnitRate["unit"]): PriceUnitRate | PriceUnavailable {
  if (!(area > 0) || !(pkr > 0)) return unavailable();
  return { unit, pkr: Math.round(pkr / area), kind: "asking", source: "user_provided" };
}

/**
 * Asking-price arithmetic from what the user typed. No market feed, no invented comparables.
 * Transaction prices, listings history, and rent estimates stay unavailable until a legal source exists.
 */
export function assessPriceIntel(answers: CheckAnswers): PriceIntelligence {
  const pkr = parsePkr(answers.price);
  const area = resolveArea(answers);
  const asking =
    pkr && answers.price.trim()
      ? { raw: answers.price.trim(), pkr, source: "user_provided" as const, kind: "asking" as const }
      : null;

  let perMarla: PriceUnitRate | PriceUnavailable = unavailable();
  let perKanal: PriceUnitRate | PriceUnavailable = unavailable();
  let perSqft: PriceUnitRate | PriceUnavailable = unavailable();

  if (asking && area) {
    const marla = toMarla(area.amount, area.unit);
    const kanal = toKanal(area.amount, area.unit);
    const sqft = toSqft(area.amount, area.unit);
    if (marla != null) perMarla = rate(asking.pkr, marla, "marla");
    if (kanal != null) perKanal = rate(asking.pkr, kanal, "kanal");
    if (sqft != null) perSqft = rate(asking.pkr, sqft, "sqft");
  }

  return {
    asking,
    transaction: unavailable(),
    perMarla,
    perKanal,
    perSqft,
    comparables: unavailable(),
    historicalAsking: unavailable(),
    rentalEstimate: unavailable(),
    priceRange: unavailable(),
    disclaimer: L(
      "Asking price is what someone quoted. It is not a confirmed sale price. This platform has no live registry tape, listing feed, or rental index. Unit rates below are only asking ÷ size from what you typed. They are user-provided arithmetic, not a valuation.",
      "منگی قیمت وہ ہے جو کسی نے بتائی۔ تصدیق شدہ فروخت کی قیمت نہیں۔ اس پلیٹ فارم کے پاس لائیو رجسٹری، لسٹنگ فیڈ یا کرایہ انڈیکس نہیں۔ نیچے یونٹ ریٹ صرف منگی قیمت ÷ رقبہ ہے جو آپ نے لکھا۔ یہ آپ کی بتائی حساب ہے، ویلیو ایشن نہیں۔",
      "Mangi qeemat woh hai jo kisi ne batayi. Tasdeeq shuda farokht ki qeemat nahi. Is platform ke paas live registry, listing feed ya kiraya index nahi. Neeche unit rate sirf mangi qeemat ÷ raqba hai jo aap ne likha. Yeh aap ki batayi hisab hai, valuation nahi.",
    ),
  };
}

export function isPriceUnavailable(row: PriceUnitRate | PriceUnavailable): row is PriceUnavailable {
  return "available" in row && row.available === false;
}
