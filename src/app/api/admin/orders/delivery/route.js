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
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    
    // Fetch orders with user name and address payload
    const [rows] = await db.query(`
      SELECT o.id, o.user_id, o.status, o.total_amount, o.created_at, o.fulfillment_type, o.delivery_status, o.delivery_address_id,
             u.name as customer_name, 
             u.email as customer_email,
             ca.full_name as delivery_name, 
             ca.phone_number as delivery_phone, 
             ca.street_address, 
             ca.city, 
             ca.district, 
             ca.province, 
             ca.postal_code, 
             ca.address_label
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN customer_addresses ca ON o.delivery_address_id = ca.id
      WHERE o.fulfillment_type = 'DELIVERY'
      ORDER BY o.created_at DESC
    `);
    
    return NextResponse.json({ ok: true, data: rows }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET DELIVERY ORDERS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
