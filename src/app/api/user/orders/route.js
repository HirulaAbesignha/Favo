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

export async function GET(request) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const userId = user.id || user.userId;

    // Fetch the main orders for this user
    const [orders] = await db.query(`
      SELECT o.id, o.status, o.total_amount, o.created_at, o.delivery_method, o.fulfillment_type
      FROM orders o 
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);

    if (!orders.length) {
      return NextResponse.json({ ok: true, data: [] }, { headers: corsHeaders });
    }

    // Get order items for each order
    for (const order of orders) {
      // Generate the Favo Reference Number the same way the backend generates it
      order.referenceNumber = `FAVO-${new Date(order.created_at).getFullYear()}${String(new Date(order.created_at).getMonth() + 1).padStart(2, '0')}-${order.id.toString().padStart(5, '0')}`;

      const [items] = await db.query(`
        SELECT oi.*, p.name as product_name
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `, [order.id]);

      order.items = items;
    }

    return NextResponse.json({ ok: true, data: orders }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
