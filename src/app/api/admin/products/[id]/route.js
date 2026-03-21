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
    const { name, description, price, category_id, is_active, collection } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ ok: false, error: "Name and Price are required" }, { status: 400, headers: corsHeaders });
    }

    await db.query(
      "UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, is_active = ?, collection = ? WHERE id = ?",
      [name, description || null, parseFloat(price), category_id || null, is_active !== undefined ? is_active : 1, collection || 'CORE COLLECTION', id]
    );

    return NextResponse.json({ ok: true, message: "Product updated" }, { headers: corsHeaders });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    return NextResponse.json({ ok: false, error: error.message || "Server error" }, { status: 500, headers: corsHeaders });
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
    
    await db.query("DELETE FROM products WHERE id = ?", [id]);

    return NextResponse.json({ ok: true, message: "Product deleted" }, { headers: corsHeaders });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    
    let errorMessage = "Server error";
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message.includes('foreign key constraint fails')) {
      errorMessage = "Cannot delete this product because it is referenced in other records (like inventory or orders). Please delete those first or disable the product.";
    } else {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 400, headers: corsHeaders });
  }
}
