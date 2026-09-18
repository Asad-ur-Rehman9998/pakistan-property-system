import type { GroundedClaim } from "@/types/check";

export {
  AI_STAGES,
  type AiStage,
  type EvidenceKind,
  type EvidenceRef,
  type GroundedClaim,
  type GroundedExplanation,
} from "@/types/check";

export const INSUFFICIENT = {
  en: "I don't have enough information to determine this.",
  ur: "اسے طے کرنے کے لیے میرے پاس کافی معلومات نہیں۔",
  roman: "I don't have enough information to determine this.",
} as const;

export interface EvidencePack {
  tokens: string[];
  pointers: string[];
  claims: GroundedClaim[];
}
