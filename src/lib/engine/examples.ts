import type { CheckAnswers, PaperRead, SavedCheck } from "@/types/check";
import { demoPropertyAnswers } from "@/lib/demo/data";
import { evaluate } from "./evaluate";

function urbanPlot(): CheckAnswers {
  return {
    intent: "buy",
    settlement: "urban",
    propertyKind: "plot",
    isSocietyFile: false,
    locationMethod: "search",
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
    ownerNameOnPaper: "As on allotment letter",
    counterparty: "agent",
    foundVia: "listing",
    documents: {
      ownership: "have",
      cnic_owner: "have",
      mutation: "unsure",
      society_noc: "missing",
      utility_bills: "have",
      bayana_written: "missing",
    },
    flags: {
      seen_in_person: "yes",
      occupied: "no",
      pressure_today: "no",
      name_match: "unsure",
      court_case: "no",
      society_approved: "yes",
      met_owner: "no",
    },
    price: "2.5 crore",
    tokenAmount: "5 lakh",
    notes: "",
    paperReads: [],
    tokenChecklist: {},
    buyerLocation: null,
    representativeName: "",
    representativeRelation: "",
    representativePoa: null,
  };
}

function samplePaper(partial: Partial<PaperRead> & { photoKey: string }): PaperRead {
  return {
    kind: "unknown",
    kindConfidence: 0.8,
    fields: [],
    ocrStatus: "done",
    encrypted: true,
    createdAt: "2026-01-15T10:00:00.000Z",
    ...partial,
  };
}

/** Same owner and plot; area 10 Marla vs 8 Marla — possible inconsistency, not fraud. */
function papersClash(): CheckAnswers {
  return {
    ...urbanPlot(),
    ownerNameOnPaper: "Muhammad Ali",
    plotNumber: "123",
    areaSize: "10",
    areaUnit: "marla",
    paperReads: [
      samplePaper({
        photoKey: "ex-papers-a",
        kind: "allotment",
        fields: [
          { key: "ownerName", value: "Muhammad Ali", sensitive: false, confirmed: true },
          { key: "plotNumber", value: "123", sensitive: false, confirmed: true },
          { key: "areaSize", value: "10 Marla", sensitive: false, confirmed: true },
        ],
      }),
      samplePaper({
        photoKey: "ex-papers-b",
        kind: "registry",
        fields: [
          { key: "ownerName", value: "Muhammad Ali", sensitive: false, confirmed: true },
          { key: "plotNumber", value: "123", sensitive: false, confirmed: true },
          { key: "areaSize", value: "8 Marla", sensitive: false, confirmed: true },
        ],
      }),
    ],
  };
}

function ruralLand(): CheckAnswers {
  return {
    intent: "buy",
    settlement: "rural",
    propertyKind: "agri",
    isSocietyFile: null,
    locationMethod: "manual",
    province: "punjab",
    city: "Sahiwal",
    district: "Sahiwal",
    area: "Chak 42",
    tehsil: "Chichawatni",
    village: "Chak 42",
    plotNumber: "",
    khasraNumber: "12/4",
    societyName: "",
    developerName: "",
    lat: "",
    lng: "",
    locationLabel: "Chak 42",
    hasDocuments: "no",
    areaSize: "4",
    areaUnit: "kanal",
    ownerNameOnPaper: "Family khata",
    counterparty: "relative",
    foundVia: "friend",
    documents: {
      fard: "missing",
      khasra: "unsure",
      aks_shajra: "missing",
      mutation: "missing",
      cnic_owner: "have",
      registry: "missing",
      bayana_written: "missing",
      warasat: "missing",
    },
    flags: {
      seen_in_person: "yes",
      occupied: "yes",
      pressure_today: "no",
      name_match: "unsure",
      court_case: "unsure",
      all_heirs: "no",
    },
    price: "80 lakh",
    tokenAmount: "3 lakh",
    notes: "Bhai keh raha hai warasat baad mein ho jayegi, zameen family ki hai.",
    paperReads: [],
    tokenChecklist: {},
    buyerLocation: null,
    representativeName: "",
    representativeRelation: "",
    representativePoa: null,
  };
}

function rushedToken(): CheckAnswers {
  return {
    intent: "token",
    settlement: "urban",
    propertyKind: "house",
    isSocietyFile: null,
    locationMethod: "search",
    province: "sindh",
    city: "Karachi",
    district: "Malir",
    area: "New society near Super Highway",
    tehsil: "",
    village: "",
    plotNumber: "",
    khasraNumber: "",
    societyName: "New society near Super Highway",
    developerName: "",
    lat: "",
    lng: "",
    locationLabel: "Karachi · Sindh",
    hasDocuments: "no",
    areaSize: "5",
    areaUnit: "marla",
    ownerNameOnPaper: "",
    counterparty: "unknown",
    foundVia: "whatsapp",
    documents: {
      ownership: "missing",
      cnic_owner: "missing",
      mutation: "missing",
      society_noc: "missing",
      approved_plan: "missing",
      utility_bills: "unsure",
      bayana_written: "missing",
    },
    flags: {
      seen_in_person: "no",
      occupied: "unsure",
      pressure_today: "yes",
      name_match: "unsure",
      court_case: "unsure",
      society_approved: "no",
    },
    price: "1.5 crore",
    tokenAmount: "40 lakh",
    notes: "Dealer keh raha hai aaj hi token do, kal offer khatam, sirf cash.",
    paperReads: [],
    tokenChecklist: {
      seller_identity: "missing",
      ownership: "missing",
      property_documents: "missing",
      boundaries: "verify",
      outstanding_issues: "verify",
      society_developer: "missing",
      possession: "verify",
      utilities: "verify",
      taxes_dues: "na",
      sale_agreement: "missing",
      payment_details: "missing",
      legal_review: "missing",
    },
    buyerLocation: null,
    representativeName: "",
    representativeRelation: "",
    representativePoa: null,
  };
}

function overseasBuyer(): CheckAnswers {
  return {
    ...urbanPlot(),
    city: "Islamabad",
    district: "Islamabad",
    area: "Bahria Town Phase 7",
    societyName: "Bahria Town Phase 7",
    plotNumber: "88",
    locationLabel: "Bahria Town Phase 7, Islamabad",
    buyerLocation: "abroad",
    representativeName: "Ali Khan",
    representativeRelation: "brother",
    representativePoa: "yes",
    flags: {
      ...urbanPlot().flags,
      seen_in_person: "no",
      remote_video_owner: "unsure",
      remote_papers: "yes",
      remote_local_visit: "no",
      overseas_want_review: "yes",
    },
    notes: "I am in Dubai. Buying Bahria Town Phase 7 plot. Brother in Islamabad has a mukhtarnama copy.",
  };
}

const SHARED_LISTING_PRINT = "a1b2c3d4e5f60718";

/** Same DHA Phase 6 plot 412, advertised by three different dealers — possible duplicate, not fraud. */
function dupListingA(): CheckAnswers {
  return {
    ...urbanPlot(),
    hasDocuments: "no",
    documents: {},
    ownerNameOnPaper: "",
    flags: { ...urbanPlot().flags, seen_in_person: "no", met_owner: "no" },
    counterparty: "agent",
    foundVia: "whatsapp",
    price: "2.6 crore",
    tokenAmount: "6 lakh",
    notes: "DEMO DATA — NOT A REAL PROPERTY. DHA Phase 6 plot 412, 10 marla, dealer Ali WhatsApp (fictional — no real phone), jaldi token.",
    paperReads: [samplePaper({ photoKey: "ex-dup-a-img", imagePrint: SHARED_LISTING_PRINT })],
  };
}

function dupListingB(): CheckAnswers {
  return {
    ...urbanPlot(),
    hasDocuments: "no",
    documents: {},
    ownerNameOnPaper: "",
    flags: { ...urbanPlot().flags, seen_in_person: "no" },
    counterparty: "agent",
    foundVia: "facebook",
    price: "2.45 crore",
    tokenAmount: "4 lakh",
    notes: "Phase 6 plot 412 ten marla, Facebook ad, owner nahi mila sirf dealer.",
    paperReads: [samplePaper({ photoKey: "ex-dup-b-img", imagePrint: SHARED_LISTING_PRINT })],
  };
}

function dupListingC(): CheckAnswers {
  return {
    ...urbanPlot(),
    hasDocuments: "unsure",
    documents: {},
    ownerNameOnPaper: "",
    flags: { ...urbanPlot().flags, seen_in_person: "unsure" },
    counterparty: "agent",
    foundVia: "listing",
    price: "2.5 crore",
    tokenAmount: "5 lakh",
    notes: "DEMO DATA — NOT A REAL PROPERTY. DHA Phase 6 plot 412, 10 marla online listing (fictional — no real phone).",
    paperReads: [samplePaper({ photoKey: "ex-dup-c-img", imagePrint: SHARED_LISTING_PRINT })],
  };
}

function stamp(id: string, answers: CheckAnswers): SavedCheck {
  return {
    id,
    createdAt: "2026-01-15T10:00:00.000Z",
    answers,
    report: evaluate(answers, { selfId: id }),
  };
}

function withDuplicates(bundle: Record<string, SavedCheck>): Record<string, SavedCheck> {
  const catalog = Object.values(bundle);
  const out: Record<string, SavedCheck> = {};
  for (const [key, check] of Object.entries(bundle)) {
    const candidates = catalog.filter((c) => c.id !== check.id).map((c) => ({
      id: c.id,
      href: `/r/${c.id}`,
      answers: c.answers,
    }));
    out[key] = {
      ...check,
      report: evaluate(check.answers, { selfId: check.id, duplicateCandidates: candidates }),
    };
  }
  return out;
}

export const examples: Record<string, SavedCheck> = withDuplicates({
  demo: stamp("ex-demo", demoPropertyAnswers()),
  urban: stamp("ex-urban", urbanPlot()),
  rural: stamp("ex-rural", ruralLand()),
  token: stamp("ex-token", rushedToken()),
  papers: stamp("ex-papers", papersClash()),
  overseas: stamp("ex-overseas", overseasBuyer()),
  "dup-a": stamp("ex-dup-a", dupListingA()),
  "dup-b": stamp("ex-dup-b", dupListingB()),
  "dup-c": stamp("ex-dup-c", dupListingC()),
});
