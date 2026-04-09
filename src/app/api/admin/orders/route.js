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

export async function GET(request) {
  try {
    const user = verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    
    // Fetch orders with user name
    const [rows] = await db.query(`
      SELECT o.*, u.name as customer_name
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    return NextResponse.json({ ok: true, data: rows }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    const user = verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    
    const body = await request.json();
    const { user_id, status, items, delivery_method, fulfillment_type, delivery_address_id, pickup_location_id } = body;
    
    if (!user_id || !items || !items.length) {
       return NextResponse.json({ ok: false, error: "Missing required fields or items" }, { status: 400, headers: corsHeaders });
    }

    // Calculate total amount from items
    let total_amount = 0;
    for (const item of items) {
       total_amount += parseFloat(item.price_at_time) * parseInt(item.quantity);
    }

    // Insert order
    const [orderResult] = await db.query(
      "INSERT INTO orders (user_id, status, delivery_method, fulfillment_type, delivery_address_id, pickup_location_id, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [user_id, status || 'PENDING_PAYMENT', delivery_method || null, fulfillment_type || delivery_method || null, delivery_address_id || null, pickup_location_id || null, total_amount]
    );

    const order_id = orderResult.insertId;

    // Insert items and deduct from inventory
    for (const item of items) {
        await db.query(
          "INSERT INTO order_items (order_id, product_id, size, quantity, price_at_time) VALUES (?, ?, ?, ?, ?)",
          [order_id, item.product_id, item.size || 'OS', item.quantity, item.price_at_time]
        );
       
       // Deduct the quantity from inventory 
       // (Assuming the inventory table tracks quantity via stock_quantity)
       try {
            await db.query(
              "UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND size = ?",
              [item.quantity, item.product_id, item.size || 'OS']
            );
       } catch (invErr) {
           console.warn("Failed to deduct inventory for product", item.product_id, invErr);
       }
    }

    return NextResponse.json({ ok: true, message: "Order created successfully", order_id }, { headers: corsHeaders });
  } catch (error) {
    console.error("POST ORDERS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

