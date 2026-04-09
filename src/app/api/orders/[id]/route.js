import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    const [orders] = await db.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             a.address_line1, a.address_line2, a.city, a.postal_code, a.phone_number as delivery_phone,
             pl.name as pickup_name, pl.address as pickup_address
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      LEFT JOIN customer_addresses a ON o.delivery_address_id = a.id
      LEFT JOIN order_pickup op ON o.id = op.order_id
      LEFT JOIN pickup_locations pl ON op.pickup_location_id = pl.id OR o.pickup_location_id = pl.id
      WHERE o.id = ? AND o.user_id = ?
    `, [id, user.id || user.userId]);

    if (!orders.length) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404, headers: corsHeaders });
    }

    const order = orders[0];

    const [items] = await db.query(`
      SELECT oi.*, p.name as product_name, p.image_url, i.sku
      FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id 
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    order.items = items;

    return NextResponse.json({ ok: true, data: order }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET ORDER ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
