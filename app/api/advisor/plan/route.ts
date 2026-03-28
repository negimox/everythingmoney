import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.ADVISOR_BACKEND_URL || "http://127.0.0.1:8001";

// GET /api/advisor/plan?user_id=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }
    const res = await fetch(`${BACKEND_URL}/api/plan/${userId}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}
