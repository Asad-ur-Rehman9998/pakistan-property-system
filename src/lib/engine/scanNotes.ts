import type { CheckAnswers } from "@/types/check";

export interface NoteHit {
  id: string;
  keywords: string[];
}

const patterns: { id: string; needles: string[] }[] = [
  {
    id: "token_pressure",
    needles: [
      "aaj hi token",
      "today token",
      "kal late",
      "offer khatam",
      "jaldi token",
      "right now",
      "abhi de do",
      "آج ہی",
      "جلدی ٹوکن",
    ],
  },
  {
    id: "no_fard",
    needles: ["fard nahi", "no fard", "فرد نہیں", "record baad", "fard baad mein"],
  },
  {
    id: "poa",
    needles: [
      "mukhtarnama",
      "power of attorney",
      "poa",
      "mukhtar",
      "مختارنامہ",
      "attorney",
    ],
  },
  {
    id: "court",
    needles: ["stay", "court", "muqadma", "مقدمہ", "ستے", "case chal raha"],
  },
  {
    id: "qabza",
    needles: ["qabza", "kabza", " قبضہ", "tenant", "kirayedar", "khasm", "illegal occupy"],
  },
  {
    id: "unapproved",
    needles: [
      "unapproved",
      "ghair manzoor",
      "non approved",
      "katchi",
      "illegal society",
      "غیر منظور",
      "approval pending",
    ],
  },
  {
    id: "warasat",
    needles: ["warasat", "waris", "heir", "inheritance", "وراثت", "ورثاء", "father name"],
  },
  {
    id: "file_only",
    needles: ["sirf file", "only file", "file transfer", "open file", "allocation file"],
  },
  {
    id: "cash",
    needles: ["sirf cash", "only cash", "bank mat", "no bank", "نقد", "black"],
  },
  {
    id: "overseas",
    needles: ["abroad", "dubai", "uk", "overseas", "bahir", "باہر رہتے", "foreign"],
  },
  {
    id: "cheap",
    needles: [
      "bohat sasti",
      "too cheap",
      "sasta deal",
      "below market",
      "half price",
      "بہت سستی",
      "sasti qeemat",
    ],
  },
  {
    id: "double",
    needles: ["double sale", "do dafa", "already sold", "kisi aur ko"],
  },
];

export function scanNotes(notes: string): NoteHit[] {
  const text = notes.trim().toLowerCase();
  if (!text) return [];
  const hits: NoteHit[] = [];
  for (const p of patterns) {
    const found = p.needles.filter((n) => text.includes(n.toLowerCase()));
    if (found.length) hits.push({ id: p.id, keywords: found });
  }
  return hits;
}

export function notesSuggestFlags(answers: CheckAnswers): CheckAnswers {
  const hits = scanNotes(answers.notes);
  const flags = { ...answers.flags };
  for (const h of hits) {
    if (h.id === "token_pressure" && !flags.pressure_today) flags.pressure_today = "yes";
    if (h.id === "court" && !flags.court_case) flags.court_case = "yes";
    if (h.id === "qabza" && !flags.occupied) flags.occupied = "yes";
    if (h.id === "unapproved" && !flags.society_approved) flags.society_approved = "no";
    if (h.id === "warasat" && !flags.all_heirs) flags.all_heirs = "unsure";
    if (h.id === "cheap" && !flags.too_cheap) flags.too_cheap = "yes";
  }
  return { ...answers, flags };
}
