import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Access granted",
    user
  });
}