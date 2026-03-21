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
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    const body = await request.json();
    const { sku, stock_quantity, low_stock_threshold } = body;

    await db.query(
      "UPDATE inventory SET sku = ?, stock_quantity = ?, low_stock_threshold = ? WHERE id = ?",
      [sku, stock_quantity, low_stock_threshold, id]
    );

    return NextResponse.json({ ok: true, message: "Inventory updated" }, { headers: corsHeaders });
  } catch (error) {
    console.error("UPDATE INVENTORY ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    await db.query("DELETE FROM inventory WHERE id = ?", [id]);

    return NextResponse.json({ ok: true, message: "Inventory deleted" }, { headers: corsHeaders });
  } catch (error) {
    console.error("DELETE INVENTORY ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
