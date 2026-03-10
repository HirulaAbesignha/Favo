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