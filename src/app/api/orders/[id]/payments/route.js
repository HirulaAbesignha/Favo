import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request, context) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const orderId = parseInt(params.id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid order id" },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      "SELECT * FROM payments WHERE order_id = ?",
      [orderId]
    );

    return NextResponse.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}