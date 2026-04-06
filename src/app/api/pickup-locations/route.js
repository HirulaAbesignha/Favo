import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminMode = searchParams.get("admin") === "true";

    let query = "SELECT * FROM pickup_locations";
    
    // Customers only see active locations
    if (!adminMode) {
      query += " WHERE is_active = TRUE";
    }
    
    query += " ORDER BY id DESC";

    const [rows] = await db.query(query);

    return NextResponse.json({
      ok: true,
      pickupLocations: rows
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET PICKUP LOCATIONS ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request){
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { branch_name, address_line, city, district, province, postal_code, phone_number, opening_hours } = body;

    if (!branch_name || !address_line || !city || !phone_number || !opening_hours) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    if (!/^\d{10}$/.test(phone_number)) {
      return NextResponse.json({ ok: false, error: "Phone number must be exactly 10 digits" }, { status: 400, headers: corsHeaders });
    }

    const [result] = await db.query(
      "INSERT INTO pickup_locations (branch_name, address_line, city, district, province, postal_code, phone_number, opening_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [branch_name, address_line, city, district || null, province || null, postal_code || null, phone_number, opening_hours]
    );

    return NextResponse.json({
      ok: true, 
      message: "Pickup location created successfully",
      id: result.insertId
    }, { status: 201, headers: corsHeaders });

  } catch (error) {
    console.error("POST PICKUP LOCATIONS ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}