import type { CheckAnswers } from "@/types/check";
import { TOKEN_CHECKLIST_IDS } from "@/types/check";
import { documentsFor, flagDefs } from "./documents";
import { hasPickedPlace } from "@/lib/pakistan/location";

export type WizardKey =
  | "intent"
  | "whereYouAre"
  | "kind"
  | "fileAsk"
  | "settle"
  | "locateHow"
  | "locateSearch"
  | "locateMap"
  | "district"
  | "tehsil"
  | "village"
  | "area"
  | "society"
  | "identity"
  | "size"
  | "party"
  | "foundVia"
  | "owner"
  | "price"
  | "hasDocs"
  | "upload"
  | "paperReview"
  | "token"
  | "tokenIntro"
  | "remoteVerify"
  | "overseasReview"
  | "representative"
  | "notes"
  | `doc:${string}`
  | `flag:${string}`
  | `dd:${string}`;

export function wizardPath(a: CheckAnswers): WizardKey[] {
  const path: WizardKey[] = ["intent"];

  if (a.intent === "buy" || a.intent === "token") {
    path.push("whereYouAre");
  }

  path.push("kind");

  if (a.propertyKind === "plot" || a.propertyKind === "file") {
    path.push("fileAsk");
  }

  if (a.propertyKind === "house" || (a.propertyKind === "plot" && a.isSocietyFile === false)) {
    path.push("settle");
  }

  path.push("locateHow");
  if (a.locationMethod === "search") path.push("locateSearch");
  if (a.locationMethod === "map") path.push("locateMap");
  if (a.locationMethod) {
    path.push("district", "tehsil", "village", "area", "society", "identity");
  }

  path.push("price", "hasDocs");
  if (a.hasDocuments === "yes" || a.hasDocuments === "unsure") {
    path.push("upload");
    if ((a.paperReads ?? []).length) path.push("paperReview");
  }
  path.push("size", "party", "foundVia", "owner");

  if (a.hasDocuments === "yes") {
    for (const d of documentsFor(a)) path.push(`doc:${d.id}`);
  }
  for (const f of flagDefs(a)) path.push(`flag:${f.id}`);

  if (a.intent === "token") {
    path.push("tokenIntro");
    for (const id of TOKEN_CHECKLIST_IDS) path.push(`dd:${id}`);
  }

  if (a.buyerLocation === "abroad") {
    path.push("remoteVerify", "overseasReview", "representative");
  }

  path.push("token", "notes");
  return path;
}

export function isOptionalStep(key: WizardKey): boolean {
  return (
    key === "locateMap" ||
    key === "district" ||
    key === "tehsil" ||
    key === "village" ||
    key === "area" ||
    key === "society" ||
    key === "identity" ||
    key === "price" ||
    key === "upload" ||
    key === "paperReview" ||
    key === "size" ||
    key === "foundVia" ||
    key === "owner" ||
    key === "token" ||
    key === "tokenIntro" ||
    key === "remoteVerify" ||
    key === "overseasReview" ||
    key === "representative" ||
    key === "notes" ||
    key.startsWith("doc:") ||
    key.startsWith("flag:")
  );
}

export function firstUnfilledIndex(a: CheckAnswers): number {
  const path = wizardPath(a);
  const i = path.findIndex((k) => !stepRequired(k, a));
  return i < 0 ? 0 : i;
}

export function stepRequired(key: WizardKey, a: CheckAnswers): boolean {
  if (key === "intent") return !!a.intent;
  if (key === "whereYouAre") return !!a.buyerLocation;
  if (key === "kind") return !!a.propertyKind;
  if (key === "fileAsk") return a.isSocietyFile !== null;
  if (key === "settle") return !!a.settlement;
  if (key === "locateHow") return !!a.locationMethod;
  if (key === "locateSearch") return hasPickedPlace(a);
  if (key === "hasDocs") return a.hasDocuments !== null;
  if (key === "party") return !!a.counterparty;
  if (key.startsWith("dd:")) {
    const id = key.slice(3) as keyof CheckAnswers["tokenChecklist"];
    return !!a.tokenChecklist?.[id];
  }
  return true;
}
