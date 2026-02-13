import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { requireAuth } from "@/lib/auth";
import type { Location } from "@/lib/types";

export function GET() {
  const db = getDb();
  const locations = db
    .prepare(
      `SELECT * FROM locations
       ORDER BY COALESCE(primaryTypeDisplayName, 'zzz'), name`
    )
    .all() as Location[];

  return NextResponse.json({ locations });
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const now = new Date().toISOString();

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO locations (name, address, primaryType, primaryTypeDisplayName, latitude, longitude, source, googleMapsUrl, googlePlaceId, createdAt, updatedAt)
    VALUES (@name, @address, @primaryType, @primaryTypeDisplayName, @latitude, @longitude, @source, @googleMapsUrl, @googlePlaceId, @createdAt, @updatedAt)
  `);

  const result = stmt.run({
    name: body.name,
    address: body.address ?? null,
    primaryType: body.primaryType ?? null,
    primaryTypeDisplayName: body.primaryTypeDisplayName ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    source: body.source ?? "manual",
    googleMapsUrl: body.googleMapsUrl ?? null,
    googlePlaceId: body.googlePlaceId ?? null,
    createdAt: now,
    updatedAt: now,
  });

  const created = db
    .prepare("SELECT * FROM locations WHERE id = ?")
    .get(result.lastInsertRowid) as Location;

  return NextResponse.json(created, { status: 201 });
}
