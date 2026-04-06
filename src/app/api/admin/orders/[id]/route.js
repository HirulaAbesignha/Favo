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

export async function GET(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user || user.role !== "admin") return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    const [orders] = await db.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE o.id = ?
    `, [id]);

    if (!orders.length) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404, headers: corsHeaders });
    }

    const order = orders[0];

    const [items] = await db.query(`
      SELECT oi.*, p.name as product_name, i.sku
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

export async function PUT(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user || user.role !== "admin") return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['PENDING_PAYMENT', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'PICKED_UP', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ ok: false, error: "Invalid status provided" }, { status: 400, headers: corsHeaders });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    return NextResponse.json({ ok: true, message: "Order updated" }, { headers: corsHeaders });
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user || user.role !== "admin") return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    
    await db.query("DELETE FROM orders WHERE id = ?", [id]);

    return NextResponse.json({ ok: true, message: "Order deleted" }, { headers: corsHeaders });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
