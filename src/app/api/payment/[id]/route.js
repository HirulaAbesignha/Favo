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

export async function PUT(request, context) {
  try {
    let user = verifyToken(request);

    // Fallback for Demo testing without login context:
    if (!user) {
      user = { userId: 1, role: 'admin' };
    }

    // optional: admin only
    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: admin only" },
        { status: 403, headers: corsHeaders }
      );
    }

    const params = await context.params;
    const paymentId = parseInt(params.id, 10);

    if (isNaN(paymentId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const status = (body.status || "").trim().toUpperCase();

    const allowedStatuses = ["PAID", "FAILED", "PENDING", "REFUNDED"];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment status" },
        { status: 400, headers: corsHeaders }
      );
    }

    const [result] = await db.query(
      "UPDATE payments SET status = ? WHERE id = ?",
      [status, paymentId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { ok: false, error: "Payment not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Payment updated successfully"
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("PAYMENT PUT ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // optional: admin only
    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const paymentId = parseInt(params.id, 10);

    if (isNaN(paymentId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment id" },
        { status: 400 }
      );
    }

    const [result] = await db.query(
      "DELETE FROM payments WHERE id = ?",
      [paymentId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { ok: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Payment deleted successfully"
    });
  } catch (error) {
    console.error("PAYMENT DELETE ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}