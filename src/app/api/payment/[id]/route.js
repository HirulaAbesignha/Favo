import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(request, context) {
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

    const body = await request.json();
    const status = (body.status || "").trim().toUpperCase();

    const allowedStatuses = ["PAID", "FAILED", "PENDING"];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment status" },
        { status: 400 }
      );
    }

    const [result] = await db.query(
      "UPDATE payments SET status = ? WHERE id = ?",
      [status, paymentId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { ok: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Payment updated successfully"
    });
  } catch (error) {
    console.error("PAYMENT PUT ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
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