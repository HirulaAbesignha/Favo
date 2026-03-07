import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT id, name, address, phone FROM pickup_locations ORDER BY id ASC"
    );
    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error("PICKUP_LOCATIONS_ERROR:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}