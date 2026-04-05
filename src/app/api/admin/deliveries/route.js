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
    // Expand role checking as appropriate in your actual project
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    // Join orders to users and customer_addresses
    const query = `
      SELECT 
        o.id as order_id, 
        o.created_at, 
        o.total_amount, 
        o.status as payment_status,
        o.delivery_status,
        u.name as customer_name,
        u.email as customer_email,
        a.full_name as delivery_name,
        a.phone_number,
        a.street_address,
        a.city,
        a.district,
        a.province,
        a.postal_code,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN customer_addresses a ON o.delivery_address_id = a.id
      WHERE o.fulfillment_type = 'DELIVERY'
      ORDER BY o.created_at DESC
    `;

    const [deliveries] = await db.query(query);

    return NextResponse.json({ ok: true, deliveries }, { headers: corsHeaders });

  } catch (error) {
    console.error("GET DELIVERIES ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
