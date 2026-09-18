import type { AreaUnit } from "./check";

export type DealerPersonRole = "buyer" | "seller" | "owner" | "other";

export type VisitPurpose = "see_property" | "see_papers" | "office";

export interface DealerPerson {
  id: string;
  name: string;
  phone: string;
  role: DealerPersonRole;
  note: string;
}

export interface DealerVisit {
  id: string;
  personId: string;
  when: string;
  purpose: VisitPurpose;
  done: boolean;
}

export interface DealerFollowUp {
  id: string;
  title: string;
  due: string;
  done: boolean;
}

/** A dealer-owned information page — not a listing and not a CRM record. */
export interface DealerPage {
  id: string;
  createdAt: string;
  checkId: string | null;
  city: string;
  area: string;
  plotNumber: string;
  khasraNumber: string;
  areaSize: string;
  areaUnit: AreaUnit | null;
  price: string;
  notes: string;
  people: DealerPerson[];
  visits: DealerVisit[];
  followUps: DealerFollowUp[];
}

export interface DealerImportRow {
  city: string;
  area: string;
  plotNumber: string;
  khasraNumber: string;
  areaSize: string;
  areaUnit: AreaUnit | null;
  price: string;
}
