import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { id } = params;

    const [rows] = await db.query("SELECT * FROM pickup_locations WHERE id = ?", [id]);

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Pickup location not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({
      ok: true,
      pickupLocation: rows[0]
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET PICKUP LOCATION ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const user = verifyToken(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { branch_name, address_line, city, district, province, postal_code, phone_number, opening_hours, is_active } = body;

    if (!branch_name || !address_line || !city || !phone_number || !opening_hours) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    if (!/^\d{10}$/.test(phone_number)) {
      return NextResponse.json({ ok: false, error: "Phone number must be exactly 10 digits" }, { status: 400, headers: corsHeaders });
    }

    const [existing] = await db.query("SELECT * FROM pickup_locations WHERE id = ?", [id]);
    
    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: "Location not found" }, { status: 404, headers: corsHeaders });
    }

    await db.query(
      "UPDATE pickup_locations SET branch_name = ?, address_line = ?, city = ?, district = ?, province = ?, postal_code = ?, phone_number = ?, opening_hours = ?, is_active = ? WHERE id = ?",
      [branch_name, address_line, city, district || null, province || null, postal_code || null, phone_number, opening_hours, is_active === undefined ? existing[0].is_active : is_active, id]
    );

    return NextResponse.json({ ok: true, message: "Location updated successfully" }, { headers: corsHeaders });

  } catch (error) {
    console.error("PUT PICKUP LOCATION ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const user = verifyToken(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const [existing] = await db.query("SELECT * FROM pickup_locations WHERE id = ?", [id]);
    
    if (existing.length === 0) {
      return NextResponse.json({ ok: false, error: "Location not found" }, { status: 404, headers: corsHeaders });
    }

    await db.query("DELETE FROM pickup_locations WHERE id = ?", [id]);

    return NextResponse.json({ ok: true, message: "Location deleted successfully" }, { headers: corsHeaders });

  } catch (error) {
    console.error("DELETE PICKUP LOCATION ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
