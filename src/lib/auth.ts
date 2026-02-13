import { NextRequest, NextResponse } from "next/server";

export function requireAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken || token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
