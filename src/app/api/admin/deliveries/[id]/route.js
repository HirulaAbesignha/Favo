import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const user = verifyToken(request);
    
    // Check role, adjust role check if necessary
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { delivery_status } = body;

    if (!delivery_status) {
      return NextResponse.json({ ok: false, error: "delivery_status is required" }, { status: 400, headers: corsHeaders });
    }

    const validStatuses = ['Pending', 'Preparing', 'Dispatched', 'Delivered'];
    if (!validStatuses.includes(delivery_status)) {
      return NextResponse.json({ ok: false, error: "Invalid delivery status" }, { status: 400, headers: corsHeaders });
    }

    const [result] = await db.query(
      "UPDATE orders SET delivery_status = ? WHERE id = ? AND fulfillment_type = 'DELIVERY'",
      [delivery_status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ ok: false, error: "Order not found or not a delivery order" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ ok: true, message: "Delivery status updated successfully" }, { headers: corsHeaders });

  } catch (error) {
    console.error("PATCH DELIVERY STATUS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
