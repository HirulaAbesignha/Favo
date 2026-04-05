import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PATCH(request, context) {
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
      const [existing] = await connection.query(
        "SELECT id FROM customer_addresses WHERE id = ? AND user_id = ?",
        [id, user.id || user.userId]
      );
      
      if (existing.length === 0) {
        throw new Error("Address not found or unauthorized");
      }

      // Unset previous defaults for this user
      await connection.query(
        "UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?",
        [user.id || user.userId]
      );

      // Set the requested one to default
      await connection.query(
        "UPDATE customer_addresses SET is_default = 1 WHERE id = ?",
        [id]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({ ok: true, message: "Default address updated successfully" }, { headers: corsHeaders });

    } catch (dbError) {
      await connection.rollback();
      connection.release();
      if (dbError.message === "Address not found or unauthorized") {
        return NextResponse.json({ ok: false, error: dbError.message }, { status: 404, headers: corsHeaders });
      }
      throw dbError;
    }

  } catch (error) {
    console.error("PATCH DEFAULT ADDRESS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
