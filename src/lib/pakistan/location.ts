import type { CheckAnswers, LocationMethod, ProvinceId } from "@/types/check";
import { citiesByProvince, provinces } from "./places";

export type PlaceHit = {
  id: string;
  label: string;
  kind: "city" | "district" | "society" | "village";
  province?: ProvinceId;
  city?: string;
  district?: string;
  society?: string;
  village?: string;
  lat?: string;
  lng?: string;
};

export const districts: { name: string; province: ProvinceId }[] = [
  { name: "Lahore", province: "punjab" },
  { name: "Faisalabad", province: "punjab" },
  { name: "Rawalpindi", province: "punjab" },
  { name: "Multan", province: "punjab" },
  { name: "Gujranwala", province: "punjab" },
  { name: "Sialkot", province: "punjab" },
  { name: "Bahawalpur", province: "punjab" },
  { name: "Sahiwal", province: "punjab" },
  { name: "Okara", province: "punjab" },
  { name: "Kasur", province: "punjab" },
  { name: "Sheikhupura", province: "punjab" },
  { name: "Jhelum", province: "punjab" },
  { name: "Attock", province: "punjab" },
  { name: "Chakwal", province: "punjab" },
  { name: "Sargodha", province: "punjab" },
  { name: "Rahim Yar Khan", province: "punjab" },
  { name: "Dera Ghazi Khan", province: "punjab" },
  { name: "Muzaffargarh", province: "punjab" },
  { name: "Vehari", province: "punjab" },
  { name: "Khanewal", province: "punjab" },
  { name: "Karachi East", province: "sindh" },
  { name: "Karachi West", province: "sindh" },
  { name: "Karachi South", province: "sindh" },
  { name: "Karachi Central", province: "sindh" },
  { name: "Malir", province: "sindh" },
  { name: "Hyderabad", province: "sindh" },
  { name: "Sukkur", province: "sindh" },
  { name: "Larkana", province: "sindh" },
  { name: "Thatta", province: "sindh" },
  { name: "Peshawar", province: "kpk" },
  { name: "Mardan", province: "kpk" },
  { name: "Abbottabad", province: "kpk" },
  { name: "Swat", province: "kpk" },
  { name: "Kohat", province: "kpk" },
  { name: "Dera Ismail Khan", province: "kpk" },
  { name: "Quetta", province: "balochistan" },
  { name: "Gwadar", province: "balochistan" },
  { name: "Turbat", province: "balochistan" },
  { name: "Islamabad", province: "islamabad" },
  { name: "Gilgit", province: "gb" },
  { name: "Skardu", province: "gb" },
  { name: "Muzaffarabad", province: "ajk" },
  { name: "Mirpur", province: "ajk" },
];

const societies: { name: string; city: string; province: ProvinceId }[] = [
  { name: "DHA Phase 5", city: "Lahore", province: "punjab" },
  { name: "DHA Phase 6", city: "Lahore", province: "punjab" },
  { name: "Bahria Town", city: "Lahore", province: "punjab" },
  { name: "LDA Avenue", city: "Lahore", province: "punjab" },
  { name: "Gulberg", city: "Lahore", province: "punjab" },
  { name: "Model Town", city: "Lahore", province: "punjab" },
  { name: "Johar Town", city: "Lahore", province: "punjab" },
  { name: "Askari", city: "Lahore", province: "punjab" },
  { name: "DHA", city: "Islamabad", province: "islamabad" },
  { name: "Bahria Town", city: "Islamabad", province: "islamabad" },
  { name: "Bani Gala", city: "Islamabad", province: "islamabad" },
  { name: "DHA", city: "Karachi", province: "sindh" },
  { name: "Bahria Town", city: "Karachi", province: "sindh" },
  { name: "Clifton", city: "Karachi", province: "sindh" },
  { name: "Gulshan-e-Iqbal", city: "Karachi", province: "sindh" },
  { name: "Scheme 33", city: "Karachi", province: "sindh" },
  { name: "Hayatabad", city: "Peshawar", province: "kpk" },
];

const villages: { name: string; city: string; province: ProvinceId }[] = [
  { name: "Chak 42", city: "Sahiwal", province: "punjab" },
  { name: "Chak 128", city: "Faisalabad", province: "punjab" },
];

function provinceName(id: ProvinceId) {
  return provinces.find((p) => p.id === id)?.name.en ?? id;
}

function catalog(): PlaceHit[] {
  const hits: PlaceHit[] = [];
  for (const [province, cities] of Object.entries(citiesByProvince) as [ProvinceId, string[]][]) {
    for (const city of cities) {
      hits.push({
        id: `city:${province}:${city}`,
        label: `${city} · ${provinceName(province)}`,
        kind: "city",
        province,
        city,
      });
    }
  }
  for (const d of districts) {
    hits.push({
      id: `district:${d.province}:${d.name}`,
      label: `${d.name} district · ${provinceName(d.province)}`,
      kind: "district",
      province: d.province,
      district: d.name,
      city: d.name === "Islamabad" ? "Islamabad" : undefined,
    });
  }
  for (const s of societies) {
    hits.push({
      id: `society:${s.province}:${s.city}:${s.name}`,
      label: `${s.name}, ${s.city}`,
      kind: "society",
      province: s.province,
      city: s.city,
      society: s.name,
    });
  }
  for (const v of villages) {
    hits.push({
      id: `village:${v.province}:${v.name}`,
      label: `${v.name} · ${v.city}`,
      kind: "village",
      province: v.province,
      city: v.city,
      village: v.name,
    });
  }
  return hits;
}

const ALL = catalog();

export function searchPlaces(query: string, limit = 8): PlaceHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const scored = ALL.map((hit) => {
    const hay = hit.label.toLowerCase();
    const extra = `${hit.city ?? ""} ${hit.district ?? ""} ${hit.society ?? ""} ${hit.village ?? ""}`.toLowerCase();
    let score = 0;
    if (hay.startsWith(q) || (hit.city && hit.city.toLowerCase().startsWith(q))) score = 3;
    else if (hay.includes(q) || extra.includes(q)) score = 2;
    else if (q.split(/\s+/).every((w) => hay.includes(w) || extra.includes(w))) score = 1;
    return { hit, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: PlaceHit[] = [];
  for (const { hit } of scored) {
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}

export function applyPlace(answers: CheckAnswers, hit: PlaceHit): CheckAnswers {
  return {
    ...answers,
    locationMethod: (answers.locationMethod ?? "search") as LocationMethod,
    locationLabel: hit.label,
    province: hit.province ?? answers.province,
    city: hit.city || answers.city,
    district: hit.district || answers.district,
    societyName: hit.society || answers.societyName,
    village: hit.village || answers.village,
    area: hit.society || hit.village || hit.city || answers.area,
    lat: hit.lat ?? answers.lat,
    lng: hit.lng ?? answers.lng,
  };
}

export function hasPickedPlace(a: CheckAnswers): boolean {
  return Boolean(
    a.locationLabel.trim() ||
      a.city.trim() ||
      a.district.trim() ||
      a.societyName.trim() ||
      a.village.trim() ||
      (a.lat.trim() && a.lng.trim()),
  );
}

export function osmMapUrl(lat: string, lng: string) {
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=16/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;
}

export function inferProvinceFromState(state: string): ProvinceId | undefined {
  const s = state.toLowerCase();
  if (s.includes("islamabad") || s.includes("capital")) return "islamabad";
  if (s.includes("punjab")) return "punjab";
  if (s.includes("sindh")) return "sindh";
  if (s.includes("khyber") || s.includes("pakhtunkhwa") || s.includes("nwfp")) return "kpk";
  if (s.includes("baloch")) return "balochistan";
  if (s.includes("gilgit") || s.includes("baltistan")) return "gb";
  if (s.includes("kashmir") || s.includes("azad")) return "ajk";
  return undefined;
}
