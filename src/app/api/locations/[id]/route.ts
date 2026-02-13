import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const db = getDb();
  const result = db.prepare("DELETE FROM locations WHERE id = ?").run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
