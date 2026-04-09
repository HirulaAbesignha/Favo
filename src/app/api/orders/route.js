import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import crypto from 'crypto';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { delivery_method, items, delivery_address_id, pickup_location_id } = body;

    if (!items || !items.length) {
      return NextResponse.json({ ok: false, error: "Cart is empty" }, { status: 400, headers: corsHeaders });
    }

    if (delivery_method === 'DELIVERY' && !delivery_address_id) {
      return NextResponse.json({ ok: false, error: "Delivery address is required" }, { status: 400, headers: corsHeaders });
    }

    if (delivery_method === 'PICKUP' && !pickup_location_id) {
      return NextResponse.json({ ok: false, error: "Pickup location is required" }, { status: 400, headers: corsHeaders });
    }

    // Process order in a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Calculate total and verify stock
      let total_amount = 0;
      for (const item of items) {
        const [rows] = await connection.query(
          "SELECT p.price, COALESCE(i.stock_quantity, 0) as stock_quantity FROM products p LEFT JOIN inventory i ON p.id = i.product_id AND i.size = ? WHERE p.id = ?", 
          [item.size || 'OS', item.product_id]
        );
        
        if (!rows.length) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        
        const product = rows[0];
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product_id}`);
        }
        
        item.price_at_time = product.price;
        total_amount += (item.price_at_time * item.quantity);
      }

      // Validate ownership of address BEFORE logging the order
      if (delivery_method === 'DELIVERY') {
        const [addressCheck] = await connection.query(
          "SELECT id FROM customer_addresses WHERE id = ? AND user_id = ?",
          [delivery_address_id, user.id || user.userId]
        );
        if (addressCheck.length === 0) {
          throw new Error("Invalid or unauthorized delivery address selected.");
        }
      }

      // 2. Insert into orders
      const finalStatus = body.status || 'PENDING_PAYMENT';
      const [orderResult] = await connection.query(
        "INSERT INTO orders (user_id, delivery_method, fulfillment_type, delivery_address_id, pickup_location_id, delivery_status, status, total_amount) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)",
        [user.id || user.userId, delivery_method, delivery_method, delivery_method === 'DELIVERY' ? delivery_address_id : null, delivery_method === 'PICKUP' ? pickup_location_id : null, finalStatus, total_amount]
      );
      
      const orderId = orderResult.insertId;
      
      // Generate a unique reference number
      const referenceNumber = `FAVO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${orderId.toString().padStart(5, '0')}`;

      // 3. Insert order items and update inventory
      for (const item of items) {
        await connection.query(
          "INSERT INTO order_items (order_id, product_id, size, quantity, price_at_time) VALUES (?, ?, ?, ?, ?)",
          [orderId, item.product_id, item.size || 'OS', item.quantity, item.price_at_time]
        );
        
        await connection.query(
          "UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND size = ?",
          [item.quantity, item.product_id, item.size || 'OS']
        );
      }

      // 4. Insert delivery or pickup details
      if (delivery_method === 'PICKUP') {
        await connection.query(
          "INSERT INTO order_pickup (order_id, pickup_location_id) VALUES (?, ?)",
          [orderId, pickup_location_id]
        );
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({ 
        ok: true, 
        message: "Order created successfully", 
        orderId: orderId,
        referenceNumber: referenceNumber
      }, { headers: corsHeaders });

    } catch (dbError) {
      await connection.rollback();
      connection.release();
      throw dbError;
    }

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return NextResponse.json({ ok: false, error: error.message || "Server error" }, { status: 500, headers: corsHeaders });
  }
}
