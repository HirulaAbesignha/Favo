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
    const user = verifyToken(request);
    
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const [addresses] = await db.query(
      "SELECT * FROM customer_addresses WHERE id = ? AND user_id = ?",
      [id, user.id || user.userId]
    );

    if (addresses.length === 0) {
      return NextResponse.json({ ok: false, error: "Address not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ ok: true, address: addresses[0] }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET ADDRESS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
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
      // Check ownership
      const [existing] = await connection.query(
        "SELECT * FROM customer_addresses WHERE id = ? AND user_id = ?",
        [id, user.id || user.userId]
      );
      
      if (existing.length === 0) {
        throw new Error("Address not found or unauthorized");
      }

      if (is_default && !existing[0].is_default) {
        // Unset previous default
        await connection.query(
          "UPDATE customer_addresses SET is_default = FALSE WHERE user_id = ?",
          [user.id]
        );
      } else if (existing[0].is_default && is_default === false) {
        // Cannot casually unset default if it's the only one, but we allow it if they really want,
        // although usually business logic requires at least one default if multiple exist.
        // We will just let them unset it for now.
      }

      await connection.query(
        `UPDATE customer_addresses SET 
          full_name = ?, phone_number = ?, street_address = ?, 
          city = ?, district = ?, province = ?, postal_code = ?, 
          address_label = ?, is_default = ? 
         WHERE id = ? AND user_id = ?`,
        [
          full_name, phone_number, street_address, city, 
          district || null, province || null, postal_code || null, 
          address_label || 'Home', is_default === true ? 1 : 0,
          id, user.id
        ]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({ ok: true, message: "Address updated successfully" }, { headers: corsHeaders });

    } catch (dbError) {
      await connection.rollback();
      connection.release();
      if (dbError.message === "Address not found or unauthorized") {
        return NextResponse.json({ ok: false, error: dbError.message }, { status: 404, headers: corsHeaders });
      }
      throw dbError;
    }

  } catch (error) {
    console.error("PUT ADDRESS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const user = verifyToken(request);
    
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Verify ownership
      const [address] = await connection.query(
        "SELECT is_default FROM customer_addresses WHERE id = ? AND user_id = ?",
        [id, user.id]
      );

      if (address.length === 0) {
        throw new Error("Address not found or unauthorized");
      }

      const isDeletingDefault = address[0].is_default;

      await connection.query(
        "DELETE FROM customer_addresses WHERE id = ? AND user_id = ?",
        [id, user.id]
      );

      // If they deleted their default address, explicitly set another address as default if they have any left
      if (isDeletingDefault) {
        const [remaining] = await connection.query(
          "SELECT id FROM customer_addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
          [user.id]
        );
        if (remaining.length > 0) {
          await connection.query(
            "UPDATE customer_addresses SET is_default = 1 WHERE id = ?",
            [remaining[0].id]
          );
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({ ok: true, message: "Address deleted successfully" }, { headers: corsHeaders });

    } catch (dbError) {
      await connection.rollback();
      connection.release();
      if (dbError.message === "Address not found or unauthorized") {
        return NextResponse.json({ ok: false, error: dbError.message }, { status: 404, headers: corsHeaders });
      }
      throw dbError;
    }

  } catch (error) {
    console.error("DELETE ADDRESS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
