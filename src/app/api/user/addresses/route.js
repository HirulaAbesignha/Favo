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
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const [addresses] = await db.query(
      "SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
      [user.id || user.userId]
    );

    return NextResponse.json({ ok: true, addresses }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET ADDRESSES ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { 
      full_name, phone_number, street_address, 
      city, district, province, postal_code, 
      address_label, is_default 
    } = body;

    if (!full_name || !phone_number || !street_address || !city) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    if (!/^\d{10}$/.test(phone_number)) {
      return NextResponse.json({ ok: false, error: "Phone number must be exactly 10 digits" }, { status: 400, headers: corsHeaders });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // If setting this as default, unset previous default
      if (is_default) {
        await connection.query(
          "UPDATE customer_addresses SET is_default = FALSE WHERE user_id = ?",
          [user.id || user.userId]
        );
      } else {
        // If this is the user's first address, force it to be default
        const [existing] = await connection.query(
          "SELECT COUNT(*) as count FROM customer_addresses WHERE user_id = ?",
          [user.id || user.userId]
        );
        if (existing[0].count === 0) {
          body.is_default = true;
        }
      }

      const [result] = await connection.query(
        `INSERT INTO customer_addresses 
        (user_id, full_name, phone_number, street_address, city, district, province, postal_code, address_label, is_default) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id || user.userId, full_name, phone_number, street_address, city, 
          district || null, province || null, postal_code || null, 
          address_label || 'Home', body.is_default || is_default || false
        ]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({ 
        ok: true, 
        message: "Address created successfully",
        id: result.insertId
      }, { status: 201, headers: corsHeaders });

    } catch (dbError) {
      await connection.rollback();
      connection.release();
      throw dbError;
    }

  } catch (error) {
    console.error("POST ADDRESS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
