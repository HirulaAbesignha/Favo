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

export async function POST(request) {
  try {
    let user = verifyToken(request);

    // Fallback for Demo testing without login context:
    if (!user) {
      user = { userId: 1, role: 'user' };
    }

    const body = await request.json();
    const { orderId, cardNumber, amount } = body;

    if (!orderId || !cardNumber || amount === undefined) {
      return NextResponse.json(
        { ok: false, error: "Missing payment data" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fake card validation
    if (cardNumber.length !== 16) {
      try {
        await db.query(
          "INSERT INTO payments (order_id, user_id, amount, status) VALUES (?, ?, ?, 'FAILED')",
          [orderId, user.userId, amount]
        );
      } catch (dbErr) {}

      return NextResponse.json({
        ok: false,
        message: "Payment failed"
      }, { headers: corsHeaders });
    }

    // Generate fake transaction ID
    const transactionId = "TXN_" + Math.random().toString(36).substring(2, 10);

    try {
      await db.query(
        "INSERT INTO payments (order_id, user_id, transaction_id, amount, status) VALUES (?, ?, ?, ?, 'PAID')",
        [orderId, user.userId, transactionId, amount]
      );
    } catch (dbErr) {
      console.warn("Could not insert payment, foreign key might be missing", dbErr.message);
    }

    return NextResponse.json({
      ok: true,
      message: "Payment successful",
      transactionId
    }, { headers: corsHeaders });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}