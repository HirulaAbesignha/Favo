import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    let user = verifyToken(request);

    // Fallback for Demo testing without login context:
    if (!user) {
      user = { userId: 1, role: 'admin' };
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: admin only" },
        { status: 403, headers: corsHeaders }
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
        payments.amount,
        payments.status,
        payments.created_at
      FROM payments
      LEFT JOIN users ON payments.user_id = users.id
      ORDER BY payments.id DESC
    `);

    const [paidRows] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_paid
      FROM payments
      WHERE status = 'PAID'
    `);

    const [refundRows] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_refunded
      FROM payments
      WHERE status = 'REFUNDED'
    `);

    return NextResponse.json({
      ok: true,
      data: rows,
      metrics: {
        total_paid: paidRows[0].total_paid,
        total_refunded: refundRows[0].total_refunded
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}