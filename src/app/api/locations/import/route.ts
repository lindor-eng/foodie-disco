import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { requireAuth } from "@/lib/auth";
import { parseGeoJSON } from "@/lib/geojson-parser";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const body = await request.json();

  let parsed;
  try {
    parsed = parseGeoJSON(body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid GeoJSON";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (parsed.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, total: 0 });
  }

  const db = getDb();

  // Get existing googleMapsUrls for deduplication
  const existing = new Set(
    (db.prepare("SELECT googleMapsUrl FROM locations WHERE googleMapsUrl IS NOT NULL").all() as { googleMapsUrl: string }[])
      .map((r) => r.googleMapsUrl)
  );

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO locations (name, address, latitude, longitude, source, googleMapsUrl, createdAt, updatedAt)
    VALUES (@name, @address, @latitude, @longitude, @source, @googleMapsUrl, @createdAt, @updatedAt)
  `);

  let imported = 0;
  let skipped = 0;

  const insertMany = db.transaction((locations: typeof parsed) => {
    for (const loc of locations) {
      if (loc.googleMapsUrl && existing.has(loc.googleMapsUrl)) {
        skipped++;
        continue;
      }
      stmt.run({ ...loc, createdAt: now, updatedAt: now });
      imported++;
    }
  });

  insertMany(parsed);

  return NextResponse.json({ imported, skipped, total: parsed.length });
}
