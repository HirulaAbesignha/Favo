import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, cardNumber } = body;

    if (!orderId || !cardNumber) {
      return NextResponse.json(
        { ok: false, error: "Missing payment data" },
        { status: 400 }
      );
    }

    // Fake card validation
    if (cardNumber.length !== 16) {
      await db.query(
        "INSERT INTO payments (order_id, user_id, status) VALUES (?, ?, 'FAILED')",
        [orderId, user.userId]
      );

      return NextResponse.json({
        ok: false,
        message: "Payment failed"
      });
    }

    // Generate fake transaction ID
    const transactionId = "TXN_" + Math.random().toString(36).substring(2, 10);

    await db.query(
      "INSERT INTO payments (order_id, user_id, transaction_id, status) VALUES (?, ?, ?, 'PAID')",
      [orderId, user.userId, transactionId]
    );

    return NextResponse.json({
      ok: true,
      message: "Payment successful",
      transactionId
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}