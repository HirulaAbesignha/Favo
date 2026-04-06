import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const user = verifyToken(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { pickup_status } = body;

    const validStatuses = ['Pending', 'Preparing', 'Ready for Pickup', 'Collected'];
    
    if (!pickup_status || !validStatuses.includes(pickup_status)) {
      return NextResponse.json({ ok: false, error: "Invalid or missing pickup status" }, { status: 400, headers: corsHeaders });
    }

    // Verify it is a pickup order
    const [existing] = await db.query(
      "SELECT id FROM orders WHERE id = ? AND fulfillment_type = 'PICKUP'",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: "Order not found or is not a pickup order" }, { status: 404, headers: corsHeaders });
    }

    await db.query(
      "UPDATE orders SET pickup_status = ? WHERE id = ?",
      [pickup_status, id]
    );

    return NextResponse.json({ ok: true, message: "Pickup status updated successfully" }, { headers: corsHeaders });

  } catch (error) {
    console.error("PUT PICKUP ORDER STATUS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
