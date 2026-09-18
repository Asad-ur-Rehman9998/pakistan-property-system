export type Lang = "en" | "ur" | "roman";

export type Intent = "buy" | "sell" | "rent" | "token";

export type Settlement = "urban" | "rural";

export type PropertyKind =
  | "house"
  | "plot"
  | "flat"
  | "shop"
  | "agri"
  | "industrial"
  | "file";

export type LocationMethod = "search" | "map" | "manual";

export type FoundVia =
  | "whatsapp"
  | "facebook"
  | "dealer"
  | "friend"
  | "agent"
  | "signboard"
  | "newspaper"
  | "listing"
  | "community"
  | "other";

export type Counterparty =
  | "owner"
  | "agent"
  | "relative"
  | "builder"
  | "poa"
  | "unknown";

export type BuyerLocation = "pakistan" | "abroad";

export type TriState = "yes" | "no" | "unsure";

export type AreaUnit = "marla" | "kanal" | "sqyd" | "sqft" | "acre";

export type DocState = "have" | "missing" | "unsure";

export type ChecklistMark = "confirmed" | "verify" | "missing" | "na";

export const TOKEN_CHECKLIST_IDS = [
  "seller_identity",
  "ownership",
  "property_documents",
  "boundaries",
  "outstanding_issues",
  "society_developer",
  "possession",
  "utilities",
  "taxes_dues",
  "sale_agreement",
  "payment_details",
  "legal_review",
] as const;

export type TokenChecklistId = (typeof TOKEN_CHECKLIST_IDS)[number];

export type PaperKind =
  | "fard"
  | "registry"
  | "allotment"
  | "mutation"
  | "cnic"
  | "aks_shajra"
  | "noc"
  | "utility_bills"
  | "bayana"
  | "original_file"
  | "approved_plan"
  | "warasat"
  | "rent_agreement"
  | "khasra"
  | "unknown";

export type PaperFieldKey =
  | "ownerName"
  | "otherPartyName"
  | "cnicLast4"
  | "plotNumber"
  | "khasraNumber"
  | "khewat"
  | "khatooni"
  | "mouza"
  | "areaSize"
  | "location"
  | "societyName"
  | "developerName"
  | "documentNumber"
  | "issueDate"
  | "dimensions";

export interface PaperField {
  key: PaperFieldKey;
  value: string;
  sensitive: boolean;
  confirmed: boolean | null;
}

export type OcrStatus = "pending" | "done" | "failed" | "skipped";

export interface PaperRead {
  photoKey: string;
  kind: PaperKind;
  kindConfidence: number;
  fields: PaperField[];
  ocrStatus: OcrStatus;
  encrypted: boolean;
  createdAt: string;
  /** 64-bit dHash hex from the on-device photo. Missing when the camera was skipped. */
  imagePrint?: string;
}

export type ProvinceId =
  | "punjab"
  | "sindh"
  | "kpk"
  | "balochistan"
  | "islamabad"
  | "gb"
  | "ajk";

export type Verdict = "stop" | "wait" | "careful";

export type InfoStatusLevel = "low" | "verify" | "high" | "insufficient";

export interface InfoStatus {
  level: InfoStatusLevel;
  engine: "rules";
  emoji: string;
  label: Localized;
  reasons: Localized[];
}

export type EvidenceSource =
  | "verified"
  | "user_provided"
  | "system_detected"
  | "needs_verification"
  | "unknown";

export type FindingKind =
  | "known"
  | "missing"
  | "inconsistent"
  | "verify"
  | "question";

export type Severity = "info" | "watch" | "stop";

export type RiskLane =
  | "missing_info"
  | "document_inconsistency"
  | "location_inconsistency"
  | "seller_mismatch"
  | "unusual_pricing"
  | "suspicious_listing"
  | "unverified_claims"
  | "risk_indicators";

export type RiskAttention = "high" | "medium" | "low";

export interface RiskItem {
  id: string;
  lane: RiskLane;
  attention: RiskAttention;
  title: Localized;
  why: Localized;
  evidence: Localized;
  doNow: Localized;
  source: EvidenceSource;
}

export interface Localized {
  en: string;
  ur: string;
  roman: string;
}

export interface CheckAnswers {
  intent: Intent | null;
  settlement: Settlement | null;
  propertyKind: PropertyKind | null;
  isSocietyFile: boolean | null;
  locationMethod: LocationMethod | null;
  province: ProvinceId | null;
  city: string;
  district: string;
  area: string;
  tehsil: string;
  village: string;
  plotNumber: string;
  khasraNumber: string;
  societyName: string;
  developerName: string;
  lat: string;
  lng: string;
  locationLabel: string;
  hasDocuments: TriState | null;
  areaSize: string;
  areaUnit: AreaUnit | null;
  ownerNameOnPaper: string;
  counterparty: Counterparty | null;
  foundVia: FoundVia | null;
  documents: Record<string, DocState>;
  flags: Record<string, TriState>;
  price: string;
  tokenAmount: string;
  notes: string;
  paperReads: PaperRead[];
  tokenChecklist: Partial<Record<TokenChecklistId, ChecklistMark>>;
  /** Null until asked. Abroad starts the overseas path — not a legal status. */
  buyerLocation: BuyerLocation | null;
  representativeName: string;
  representativeRelation: string;
  /** User-provided: they say they have a mukhtarnama copy. Not official verification. */
  representativePoa: TriState | null;
}

export interface Finding {
  id: string;
  kind: FindingKind;
  severity: Severity;
  source: EvidenceSource;
  title: Localized;
  why: Localized;
  doNow: Localized;
  officeHint?: Localized;
}

export interface ProvenanceCounts {
  verified: number;
  user_provided: number;
  system_detected: number;
  needs_verification: number;
  unknown: number;
}

export interface ClarityReport {
  version: 1;
  createdAt: string;
  verdict: Verdict;
  headline: Localized;
  summary: Localized;
  score: number;
  infoStatus: InfoStatus;
  hasOfficialVerification: boolean;
  provenance: ProvenanceCounts;
  known: Finding[];
  missing: Finding[];
  inconsistent: Finding[];
  verify: Finding[];
  questions: Finding[];
  lawyer: Finding[];
  recordBeforeMoney: Finding[];
  priceCheck: Finding[];
  completeness: { seen: number; missing: number; unknown: number; total: number };
  nextOffices: Localized[];
  risks: RiskItem[];
  tokenChecklist: TokenChecklistReport | null;
  /** Absent on older saved reports; never treat missing intel as a market price. */
  priceIntel?: PriceIntelligence;
  /** Possible matches against other checks or sample listings. Never a fraud verdict. */
  duplicates?: DuplicateReport;
  /** Grounded restatement of evidence. Optional LLM may only rewrite this. Not a verdict. */
  aiExplanation?: GroundedExplanation;
  /** Official APIs are not live. Do not treat this as a government record pull. */
  officialIntegrations?: {
    anyLive: false;
    hasOfficialVerification: false;
    slots: Array<{
      id: "land_records" | "fard" | "registry" | "mutation" | "noc" | "government_db";
      available: false;
      required: true;
      message: "Official verification required.";
    }>;
  };
}

export type DuplicateSignalId =
  | "location"
  | "plot"
  | "images"
  | "characteristics"
  | "description"
  | "price"
  | "contact";

export type DuplicateSignalStatus = "match" | "differ" | "unknown";

export interface DuplicateSignal {
  id: DuplicateSignalId;
  status: DuplicateSignalStatus;
  detail: Localized;
}

export interface DuplicateMatch {
  id: string;
  href: string;
  label: Localized;
  score: number;
  signals: DuplicateSignal[];
  source: "system_detected";
}

export interface DuplicateReport {
  matches: DuplicateMatch[];
  comparedCount: number;
  summary: Localized;
  disclaimer: Localized;
}

export type EvidenceKind =
  | "uploaded_document"
  | "user_provided"
  | "authoritative_source"
  | "internal_database"
  | "estimate";

export interface EvidenceRef {
  kind: EvidenceKind;
  pointer: string;
  label: Localized;
}

export interface GroundedClaim {
  id: string;
  text: Localized;
  evidence: EvidenceRef[];
}

export const AI_STAGES = ["ocr", "parser", "structured", "validation", "risk", "explain"] as const;
export type AiStage = (typeof AI_STAGES)[number];

export interface GroundedExplanation {
  engine: "rules" | "llm";
  llmUsed: boolean;
  llmRequired: false;
  stages: typeof AI_STAGES;
  claims: GroundedClaim[];
  undetermined: GroundedClaim[];
}

export interface DuplicateCandidate {
  id: string;
  href?: string;
  label?: Localized;
  answers: CheckAnswers;
}

export type PriceQuoteKind = "asking" | "transaction";

export interface PriceUnitRate {
  unit: "marla" | "kanal" | "sqft";
  pkr: number;
  kind: "asking";
  source: "user_provided";
}

export interface PriceUnavailable {
  available: false;
  message: Localized;
}

export interface PriceIntelligence {
  asking: { raw: string; pkr: number; source: "user_provided"; kind: Extract<PriceQuoteKind, "asking"> } | null;
  transaction: PriceUnavailable;
  perMarla: PriceUnitRate | PriceUnavailable;
  perKanal: PriceUnitRate | PriceUnavailable;
  perSqft: PriceUnitRate | PriceUnavailable;
  comparables: PriceUnavailable;
  historicalAsking: PriceUnavailable;
  rentalEstimate: PriceUnavailable;
  priceRange: PriceUnavailable;
  disclaimer: Localized;
}

export interface TokenChecklistItemResult {
  id: TokenChecklistId;
  mark: ChecklistMark | "unanswered";
  title: Localized;
  hint: Localized;
}

export interface TokenChecklistReport {
  items: TokenChecklistItemResult[];
  counts: {
    confirmed: number;
    verify: number;
    missing: number;
    na: number;
    unanswered: number;
  };
}

export interface SavedCheck {
  id: string;
  createdAt: string;
  answers: CheckAnswers;
  report: ClarityReport;
  /** Client-only capability URL. Never returned by the public API. */
  shareKey?: string;
  shareTokenHash?: string;
}

export const emptyAnswers = (): CheckAnswers => ({
  intent: null,
  settlement: null,
  propertyKind: null,
  isSocietyFile: null,
  locationMethod: null,
  province: null,
  city: "",
  district: "",
  area: "",
  tehsil: "",
  village: "",
  plotNumber: "",
  khasraNumber: "",
  societyName: "",
  developerName: "",
  lat: "",
  lng: "",
  locationLabel: "",
  hasDocuments: null,
  areaSize: "",
  areaUnit: null,
  ownerNameOnPaper: "",
  counterparty: null,
  foundVia: null,
  documents: {},
  flags: {},
  price: "",
  tokenAmount: "",
  notes: "",
  paperReads: [],
  tokenChecklist: {},
  buyerLocation: null,
  representativeName: "",
  representativeRelation: "",
  representativePoa: null,
});
