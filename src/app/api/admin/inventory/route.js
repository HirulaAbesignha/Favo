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

export async function GET(request) {
  try {
    const user = verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    
    const [rows] = await db.query(`
      SELECT i.*, p.name as product_name, p.price as product_price, c.name as category_name
      FROM inventory i 
      INNER JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY i.id DESC
    `);
    
    return NextResponse.json({ ok: true, data: rows }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET INVENTORY ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    const user = verifyToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { product_id, sku, stock_quantity, low_stock_threshold } = body;

    if (!product_id) {
      return NextResponse.json({ ok: false, error: "Product ID is required" }, { status: 400, headers: corsHeaders });
    }

    const [result] = await db.query(
      "INSERT INTO inventory (product_id, sku, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?)",
      [product_id, sku || null, stock_quantity || 0, low_stock_threshold || 10]
    );

    return NextResponse.json(
      { ok: true, message: "Inventory record created", data: { id: result.insertId, ...body } },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("CREATE INVENTORY ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
