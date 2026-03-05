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

    const addressLine1 = (body?.addressLine1 || "").trim();
    const addressLine2 = (body?.addressLine2 || "").trim();
    const city = (body?.city || "").trim();
    const postalCode = (body?.postalCode || "").trim();
    const phone = (body?.phone || "").trim();

    if (!addressLine1 || !city || !postalCode || !phone) {
      return NextResponse.json(
        { ok: false, error: "Missing required address fields" },
        { status: 400 }
      );
    }

    // Save/replace address for this order
    await db.query(
      `INSERT INTO addresses (order_id, address_line1, address_line2, city, postal_code, phone)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         address_line1 = VALUES(address_line1),
         address_line2 = VALUES(address_line2),
         city = VALUES(city),
         postal_code = VALUES(postal_code),
         phone = VALUES(phone)`,
      [orderId, addressLine1, addressLine2 || null, city, postalCode, phone]
    );

    // Update order delivery method
    await db.query(
      "UPDATE orders SET delivery_method = 'DELIVERY' WHERE id = ?",
      [orderId]
    );

    return NextResponse.json({
      ok: true,
      message: "Delivery details saved",
      data: { orderId, deliveryMethod: "DELIVERY" }
    });
  } catch (err) {
    console.error("DELIVERY_ERROR:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}