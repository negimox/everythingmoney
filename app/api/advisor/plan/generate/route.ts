import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.ADVISOR_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(req: NextRequest) {
  try {
    let userId = "";
    let sessionId = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await req.json();
      userId = json.user_id;
      sessionId = json.session_id || "";
    } else {
      const formData = await req.formData();
      userId = formData.get("user_id") as string;
      sessionId = (formData.get("session_id") as string) || "";
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    const outgoingForm = new FormData();
    outgoingForm.append("user_id", userId);
    if (sessionId) {
      outgoingForm.append("session_id", sessionId);
    }

    const res = await fetch(`${BACKEND_URL}/api/plan/generate`, {
      method: "POST",
      body: outgoingForm,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 },
    );
  }
}
