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
    
    const [rows] = await db.query(`
      SELECT o.id, o.user_id, o.status, o.total_amount, o.created_at, o.fulfillment_type, o.pickup_status, 
             u.name as customer_name, 
             u.email as customer_email,
             o.pickup_location_id,
             pl.branch_name,
             pl.phone_number as branch_phone,
             pl.address_line,
             pl.city
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN pickup_locations pl ON o.pickup_location_id = pl.id
      WHERE o.fulfillment_type = 'PICKUP'
      ORDER BY o.created_at DESC
    `);
    
    return NextResponse.json({ ok: true, data: rows }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET PICKUP ORDERS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
