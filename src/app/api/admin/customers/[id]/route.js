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

export async function PUT(request, { params }) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: admin only" },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, role, is_blocked } = body;

    // Build the query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }

    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }

    if (is_blocked !== undefined) {
      updates.push("is_blocked = ?");
      values.push(is_blocked ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400, headers: corsHeaders });
    }

    values.push(id);

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({
      ok: true,
      data: { message: "User updated successfully" }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
