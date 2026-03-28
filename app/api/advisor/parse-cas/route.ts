import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.ADVISOR_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const res = await fetch(`${BACKEND_URL}/api/parse-cas`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to parse CAS PDF" },
      { status: 500 }
    );
  }
}
