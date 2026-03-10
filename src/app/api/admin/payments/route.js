import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    const [rows] = await db.query(`
      SELECT 
        payments.id,
        payments.order_id,
        payments.user_id,
        users.name AS customer_name,
        users.email AS customer_email,
        payments.transaction_id,
        payments.method,
        payments.status,
        payments.created_at
      FROM payments
      LEFT JOIN users ON payments.user_id = users.id
      ORDER BY payments.id DESC
    `);

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