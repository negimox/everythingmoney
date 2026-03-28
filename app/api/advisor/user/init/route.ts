import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.ADVISOR_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    if (!payload.clerk_user_id) {
      return NextResponse.json({ error: "clerk_user_id required" }, { status: 400 });
    }
    
    const res = await fetch(`${BACKEND_URL}/api/user/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to initialize user session" },
      { status: 500 }
    );
  }
}
