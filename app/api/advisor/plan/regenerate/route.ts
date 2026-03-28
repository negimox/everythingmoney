import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.ADVISOR_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const res = await fetch(`${BACKEND_URL}/api/plan/regenerate`, {
      method: "POST",
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to regenerate plan" },
      { status: 500 }
    );
  }
}
