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
        addresses.id,
        addresses.order_id,
        orders.user_id,
        users.name AS customer_name,
        users.email AS customer_email,
        addresses.address_line1,
        addresses.address_line2,
        addresses.city,
        addresses.postal_code,
        addresses.phone
      FROM addresses
      LEFT JOIN orders ON addresses.order_id = orders.id
      LEFT JOIN users ON orders.user_id = users.id
      ORDER BY addresses.id DESC
    `);

    return NextResponse.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error("GET ADDRESSES ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = verifyToken(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // The 'addresses' table requires an 'order_id' which does not have a default value.
    // We create a dummy order first to fulfill this foreign key constraint.
    const [orderResult] = await db.query(
      "INSERT INTO orders (user_id, delivery_method, status, total_amount) VALUES (?, 'DELIVERY', 'PENDING_PAYMENT', 0)",
      [user.id || 1] // Fallback to 1 if user.id is missing
    );

    const dummyOrderId = orderResult.insertId;

    const [result] = await db.query(
      "INSERT INTO addresses (order_id, address_line1, address_line2, city, postal_code, phone) VALUES (?, ?, ?, ?, ?, ?)",
      [dummyOrderId, body.address_line1, body.address_line2 || null, body.city, body.postal_code, body.phone]
    );

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: result.insertId,
          ...body,
          created_at: new Date().toISOString()
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST ADDRESS ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}