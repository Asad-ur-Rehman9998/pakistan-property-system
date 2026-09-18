import type { CheckAnswers, Finding, Localized, PaperField, PaperFieldKey, PaperKind, PaperRead } from "@/types/check";
import { areasCompare } from "@/lib/pakistan/area";
import { idsConflict, namesConflict } from "./names";
import { fieldValue } from "./extract";
import { formatCnicLast4 } from "./sensitive";

function L(en: string, ur: string, roman: string): Localized {
  return { en, ur, roman };
}

const FIELD_NAME: Record<string, Localized> = {
  ownerName: L("owner name", "مالک کا نام", "malik ka naam"),
  plotNumber: L("plot / file number", "پلاٹ / فائل نمبر", "plot / file number"),
  khasraNumber: L("khasra", "خسرہ", "khasra"),
  khewat: L("khewat", "کھیوت", "khewat"),
  khatooni: L("khatooni", "کھتونی", "khatooni"),
  mouza: L("mouza", "موضع", "mauza"),
  areaSize: L("property area", "رقبہ", "raqba"),
  societyName: L("society", "سوسائٹی", "society"),
  location: L("location", "جگہ", "jagah"),
  dimensions: L("dimensions", "پیمائش", "paimaish"),
  documentNumber: L("document number", "دستاویز نمبر", "dastavez number"),
  otherPartyName: L("other party name", "دوسری فریق", "doosri party"),
  developerName: L("developer", "ڈویلپر", "developer"),
  cnicLast4: L("CNIC ending", "شناختی کے آخری ہندسے", "CNIC ending"),
};

const KIND_SHORT: Record<PaperKind, Localized> = {
  fard: L("Fard", "فرد", "Fard"),
  registry: L("Registry", "رجسٹری", "Registry"),
  allotment: L("Allotment", "الاٹمنٹ", "Allotment"),
  mutation: L("Intiqal", "انتقال", "Intiqal"),
  cnic: L("CNIC", "شناختی کارڈ", "CNIC"),
  aks_shajra: L("Aks Shajra", "عکس شجرہ", "Aks Shajra"),
  noc: L("NOC", "این او سی", "NOC"),
  utility_bills: L("Utility bill", "بل", "Utility bill"),
  bayana: L("Bayana", "بیعانہ", "Bayana"),
  original_file: L("File", "فائل", "File"),
  approved_plan: L("Plan", "نقشہ", "Plan"),
  warasat: L("Warasat", "وراثت", "Warasat"),
  rent_agreement: L("Rent agreement", "کرایہ نامہ", "Kiraya nama"),
  khasra: L("Khasra", "خسرہ", "Khasra"),
  unknown: L("Paper", "کاغذ", "Kaghaz"),
};

function usable(read: PaperRead): boolean {
  return read.ocrStatus === "done" || read.ocrStatus === "skipped";
}

function usableField(f: PaperField): boolean {
  return !!f.value && f.confirmed !== false;
}

function docLabel(read: PaperRead, index: number): Localized {
  const letter = String.fromCharCode(65 + index);
  const kind = KIND_SHORT[read.kind];
  if (read.kind === "unknown") {
    return L(`Document ${letter}`, `دستاویز ${letter}`, `Document ${letter}`);
  }
  return L(`Document ${letter} (${kind.en})`, `دستاویز ${letter} (${kind.ur})`, `Document ${letter} (${kind.roman})`);
}

function collected(
  reads: PaperRead[],
  key: PaperFieldKey,
): { value: string; label: Localized; confirmed: boolean }[] {
  const out: { value: string; label: Localized; confirmed: boolean }[] = [];
  reads.forEach((r, i) => {
    if (!usable(r)) return;
    const f = r.fields.find((x) => x.key === key && usableField(x));
    if (f) out.push({ value: f.value, label: docLabel(r, i), confirmed: f.confirmed === true });
  });
  return out;
}

function join(parts: Localized[]): Localized {
  return L(parts.map((p) => p.en).join("\n"), parts.map((p) => p.ur).join("\n"), parts.map((p) => p.roman).join("\n"));
}

function mismatchFinding(
  id: string,
  field: string,
  left: { label: Localized; value: string },
  right: { label: Localized; value: string },
  extra?: Localized,
): Finding {
  const name = FIELD_NAME[field] ?? L(field, field, field);
  const lines = join([
    L(
      `The ${name.en} differs between the documents.`,
      `کاغذات پر ${name.ur} نہیں ملتا۔`,
      `Kaghazat par ${name.roman} nahi milta.`,
    ),
    L(`${left.label.en}: ${left.value}`, `${left.label.ur}: ${left.value}`, `${left.label.roman}: ${left.value}`),
    L(`${right.label.en}: ${right.value}`, `${right.label.ur}: ${right.value}`, `${right.label.roman}: ${right.value}`),
    extra ??
      L(
        "Unable to determine which paper is right. This is not official verification.",
        "پتہ نہیں کون سا کاغذ درست ہے۔ یہ سرکاری تصدیق نہیں۔",
        "Pata nahi kaun sa kaghaz durust hai. Yeh sarkari tasdeeq nahi.",
      ),
  ]);
  return {
    id,
    kind: "inconsistent",
    severity: "watch",
    source: "needs_verification",
    title: L(`Possible inconsistency — ${name.en}`, `ممکنہ تضاد — ${name.ur}`, `Mumkina tazad — ${name.roman}`),
    why: lines,
    doNow: L(
      "Please verify this with the relevant authority or a qualified professional (society office, patwari, registrar, or lawyer).",
      "براہ کرم متعلقہ دفتر یا اہل پیشہ ور سے تصدیق کریں (سوسائٹی آفس، پٹواری، رجسٹرار، یا وکیل)۔",
      "Barah-e-karam mutaliqa daftar ya ehl pesha war se tasdeeq karein (society office, patwari, registrar, ya wakeel).",
    ),
  };
}

function undeterminedFinding(id: string, field: string, left: { label: Localized; value: string }, right: { label: Localized; value: string }): Finding {
  const name = FIELD_NAME[field] ?? L(field, field, field);
  return {
    id,
    kind: "verify",
    severity: "watch",
    source: "needs_verification",
    title: L(`Unable to determine — ${name.en}`, `تعین نہیں ہو سکا — ${name.ur}`, `Taeen nahi ho saka — ${name.roman}`),
    why: join([
      L(
        `Unable to determine whether the ${name.en} matches. The units or wording differ.`,
        `${name.ur} ملتا ہے یا نہیں، تعین نہیں ہو سکا۔ ناپ یا الفاظ الگ ہیں۔`,
        `${name.roman} milta hai ya nahi, taeen nahi ho saka. Naap ya alfaaz alag hain.`,
      ),
      L(`${left.label.en}: ${left.value}`, `${left.label.ur}: ${left.value}`, `${left.label.roman}: ${left.value}`),
      L(`${right.label.en}: ${right.value}`, `${right.label.ur}: ${right.value}`, `${right.label.roman}: ${right.value}`),
    ]),
    doNow: L(
      "Please verify this with the relevant authority or a qualified professional.",
      "براہ کرم متعلقہ دفتر یا اہل پیشہ ور سے تصدیق کریں۔",
      "Barah-e-karam mutaliqa daftar ya ehl pesha war se tasdeeq karein.",
    ),
  };
}

function firstPairMismatch(
  items: { value: string; label: Localized; confirmed: boolean }[],
  conflict: (a: string, b: string) => boolean,
): { left: (typeof items)[0]; right: (typeof items)[0] } | null {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (conflict(items[i].value, items[j].value)) return { left: items[i], right: items[j] };
    }
  }
  return null;
}

const ID_KEYS: PaperFieldKey[] = ["plotNumber", "khasraNumber", "khewat", "khatooni", "documentNumber"];
const NAME_KEYS: PaperFieldKey[] = ["ownerName", "otherPartyName", "developerName"];
const TEXT_KEYS: PaperFieldKey[] = ["mouza", "societyName", "location", "dimensions"];

function textConflict(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/\s+/g, " ").trim();
  const nb = b.toLowerCase().replace(/\s+/g, " ").trim();
  if (na.length < 2 || nb.length < 2) return false;
  if (na === nb) return false;
  if (na.includes(nb) || nb.includes(na)) return false;
  return true;
}

/** Core: compare extracted fields across papers. Never calls fraud. */
export function compareDocuments(answers: CheckAnswers): Finding[] {
  const reads = (answers.paperReads ?? []).filter(usable);
  const findings: Finding[] = [];
  if (!reads.length) return findings;

  if (reads.length >= 2) {
    const areas = collected(reads, "areaSize");
    for (let i = 0; i < areas.length; i += 1) {
      for (let j = i + 1; j < areas.length; j += 1) {
        const cmp = areasCompare(areas[i].value, areas[j].value);
        if (cmp === "mismatch") {
          findings.push(mismatchFinding(`consist_area:${i}:${j}`, "areaSize", areas[i], areas[j]));
        } else if (cmp === "undetermined") {
          findings.push(undeterminedFinding(`consist_area_units:${i}:${j}`, "areaSize", areas[i], areas[j]));
        }
      }
    }

    for (const key of NAME_KEYS) {
      const hit = firstPairMismatch(collected(reads, key), namesConflict);
      if (hit) findings.push(mismatchFinding(`consist_${key}`, key, hit.left, hit.right));
    }
    for (const key of ID_KEYS) {
      const hit = firstPairMismatch(collected(reads, key), idsConflict);
      if (hit) findings.push(mismatchFinding(`consist_${key}`, key, hit.left, hit.right));
    }
    for (const key of TEXT_KEYS) {
      const hit = firstPairMismatch(collected(reads, key), textConflict);
      if (hit) findings.push(mismatchFinding(`consist_${key}`, key, hit.left, hit.right));
    }
    const cnicHit = firstPairMismatch(collected(reads, "cnicLast4"), idsConflict);
    if (cnicHit) {
      findings.push(
        mismatchFinding(
          "consist_cnicLast4",
          "cnicLast4",
          { ...cnicHit.left, value: formatCnicLast4(cnicHit.left.value) },
          { ...cnicHit.right, value: formatCnicLast4(cnicHit.right.value) },
          L(
            "Only the last four digits were kept. Unable to determine identity. This is not a NADRA check.",
            "صرف آخری چار ہندسے رکھے گئے۔ شناخت کا تعین نہیں۔ یہ نادرا چیک نہیں۔",
            "Sirf aakhri char hindsay rakhe gaye. Shanakht ka taeen nahi. Yeh NADRA check nahi.",
          ),
        ),
      );
    }
  }

  const paperOwner = fieldValue(reads.flatMap((r) => r.fields.filter(usableField)), "ownerName");
  if (answers.ownerNameOnPaper?.trim() && paperOwner && namesConflict(answers.ownerNameOnPaper, paperOwner)) {
    findings.push(
      mismatchFinding(
        "consist_typed_owner",
        "ownerName",
        { label: L("What you typed", "جو آپ نے لکھا", "Jo aap ne likha"), value: answers.ownerNameOnPaper.trim() },
        { label: L("A paper", "ایک کاغذ", "Ek kaghaz"), value: paperOwner },
      ),
    );
  }
  const paperPlot = fieldValue(reads.flatMap((r) => r.fields.filter(usableField)), "plotNumber");
  if (answers.plotNumber?.trim() && paperPlot && idsConflict(answers.plotNumber, paperPlot)) {
    findings.push(
      mismatchFinding(
        "consist_typed_plot",
        "plotNumber",
        { label: L("What you typed", "جو آپ نے لکھا", "Jo aap ne likha"), value: answers.plotNumber.trim() },
        { label: L("A paper", "ایک کاغذ", "Ek kaghaz"), value: paperPlot },
      ),
    );
  }
  const paperKhasra = fieldValue(reads.flatMap((r) => r.fields.filter(usableField)), "khasraNumber");
  if (answers.khasraNumber?.trim() && paperKhasra && idsConflict(answers.khasraNumber, paperKhasra)) {
    findings.push(
      mismatchFinding(
        "consist_typed_khasra",
        "khasraNumber",
        { label: L("What you typed", "جو آپ نے لکھا", "Jo aap ne likha"), value: answers.khasraNumber.trim() },
        { label: L("A paper", "ایک کاغذ", "Ek kaghaz"), value: paperKhasra },
      ),
    );
  }
  if (answers.areaSize?.trim() && answers.areaUnit) {
    const typed = `${answers.areaSize} ${answers.areaUnit}`;
    const paperArea = fieldValue(reads.flatMap((r) => r.fields.filter(usableField)), "areaSize");
    if (paperArea && areasCompare(typed, paperArea) === "mismatch") {
      findings.push(
        mismatchFinding(
          "consist_typed_area",
          "areaSize",
          { label: L("What you typed", "جو آپ نے لکھا", "Jo aap ne likha"), value: typed },
          { label: L("A paper", "ایک کاغذ", "Ek kaghaz"), value: paperArea },
        ),
      );
    }
  }

  return findings;
}

export function isConsistencyFinding(f: Finding): boolean {
  return f.id.startsWith("consist_");
}
