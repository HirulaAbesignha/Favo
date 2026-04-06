import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const orderId = Number(params.id);
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Invalid order id" }, { status: 400 });
    }

    const body = await request.json();
    const pickupLocationId = Number(body?.pickupLocationId);

    if (!pickupLocationId) {
      return NextResponse.json(
        { ok: false, error: "pickupLocationId is required" },
        { status: 400 }
      );
    }

    // Check if pickup location exists
    const [loc] = await db.query(
      "SELECT id FROM pickup_locations WHERE id = ? LIMIT 1",
      [pickupLocationId]
    );

    if (loc.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid pickup location" },
        { status: 400 }
      );
    }

    // Save/replace pickup choice
    await db.query(
      `INSERT INTO order_pickup (order_id, pickup_location_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE pickup_location_id = VALUES(pickup_location_id)`,
      [orderId, pickupLocationId]
    );

    // Update order delivery method
    await db.query(
      "UPDATE orders SET delivery_method = 'PICKUP' WHERE id = ?",
      [orderId]
    );

    return NextResponse.json({
      ok: true,
      message: "Pickup details saved",
      data: { orderId, deliveryMethod: "PICKUP", pickupLocationId }
    });
  } catch (err) {
    console.error("PICKUP_ERROR:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}