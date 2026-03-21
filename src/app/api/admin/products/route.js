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
    
    // Fetch products along with category name
    const [rows] = await db.query(`
      SELECT p.*, c.name as category_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);
    
    return NextResponse.json({ ok: true, data: rows }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
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
    const { name, description, price, category_id, is_active, collection } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ ok: false, error: "Name and Price are required" }, { status: 400, headers: corsHeaders });
    }

    const [result] = await db.query(
      "INSERT INTO products (name, description, price, category_id, is_active, collection) VALUES (?, ?, ?, ?, ?, ?)",
      [name, description || null, parseFloat(price), category_id || null, is_active !== undefined ? is_active : 1, collection || 'CORE COLLECTION']
    );

    return NextResponse.json(
      { ok: true, message: "Product created", data: { id: result.insertId, ...body } },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    return NextResponse.json({ ok: false, error: error.message || "Server error" }, { status: 500, headers: corsHeaders });
  }
}
