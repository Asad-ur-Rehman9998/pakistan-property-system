import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rateLimit";
import { inferProvinceFromState, type PlaceHit } from "@/lib/pakistan/location";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`geo:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 80) {
    return NextResponse.json({ hits: [] as PlaceHit[] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "pk");
  url.searchParams.set("q", q);

  try {
    const res = await fetch(url, {
      headers: { "user-agent": "PropertyCheckPakistan/1.0 (property-due-diligence)" },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return NextResponse.json({ hits: [] as PlaceHit[] });
    const rows = (await res.json()) as {
      lat: string;
      lon: string;
      display_name: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        state?: string;
        suburb?: string;
      };
    }[];

    const hits: PlaceHit[] = rows.map((row, i) => {
      const city = row.address?.city || row.address?.town || "";
      const village = row.address?.village || "";
      const district = row.address?.county || "";
      return {
        id: `osm:${row.lat}:${row.lon}:${i}`,
        label: row.display_name,
        kind: village ? "village" : city ? "city" : "district",
        province: inferProvinceFromState(row.address?.state || ""),
        city,
        district,
        village,
        society: row.address?.suburb || "",
        lat: row.lat,
        lng: row.lon,
      };
    });
    return NextResponse.json({ hits });
  } catch {
    return NextResponse.json({ hits: [] as PlaceHit[] });
  }
}
