import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.ADVISOR_BACKEND_URL || "http://127.0.0.1:8001";

export async function GET(req: NextRequest) {
  try {
    const clerkId = req.nextUrl.searchParams.get("clerk_id");
    if (!clerkId) {
      return NextResponse.json({ error: "clerk_id required" }, { status: 400 });
    }
    const res = await fetch(
      `${BACKEND_URL}/api/user/by-clerk/${clerkId}`,
      { method: "GET", cache: "no-store" }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to lookup user" },
      { status: 500 }
    );
  }
}
