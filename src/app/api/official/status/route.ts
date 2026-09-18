import { NextResponse } from "next/server";
import { officialSnapshot } from "@/lib/official/registry";

/** Availability only. This is not a land-record, fard, registry, mutation, or NOC lookup. */
export async function GET() {
  return NextResponse.json(officialSnapshot());
}

export async function POST() {
  return NextResponse.json(
    { error: "unavailable", message: "Official verification required." },
    { status: 405 },
  );
}
