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
    // const user = verifyToken(request);
    // if (!user || user.role !== "admin") {
    //   return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    // }
    
    const [rows] = await db.query(`
      SELECT 
        i.*, 
        p.name as product_name, 
        p.price as product_price, 
        c.name as category_name,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = i.product_id ORDER BY id ASC LIMIT 1) as image_url
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
    const { product_id, sku, stock_quantity, low_stock_threshold, size } = body;

    if (!product_id) {
      return NextResponse.json({ ok: false, error: "Product ID is required" }, { status: 400, headers: corsHeaders });
    }
    if (!size || size.trim() === '') {
      return NextResponse.json({ ok: false, error: "Size is required" }, { status: 400, headers: corsHeaders });
    }

    const [result] = await db.query(
      "INSERT INTO inventory (product_id, sku, stock_quantity, low_stock_threshold, size) VALUES (?, ?, ?, ?, ?)",
      [product_id, sku || null, stock_quantity || 0, low_stock_threshold || 10, size.trim()]
    );

    return NextResponse.json(
      { ok: true, message: "Inventory record created", data: { id: result.insertId, ...body } },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("CREATE INVENTORY ERROR:", error);
    let errorMessage = error.message || "Server error";
    
    // Handle MySQL specific errors
    if (error.code === 'ER_DUP_ENTRY') {
      if (errorMessage.includes('inventory.product_id') || errorMessage.includes('inventory_product_id')) {
        errorMessage = "Inventory record for this product already exists.";
      } else if (errorMessage.includes('inventory.sku') || errorMessage.includes('inventory_sku')) {
        errorMessage = "An inventory record with this SKU already exists.";
      } else {
        errorMessage = "Record already exists.";
      }
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2' || errorMessage.includes('foreign key constraint fails')) {
      errorMessage = "Invalid Product ID. Please ensure the product exists.";
    }

    return NextResponse.json({ ok: false, error: errorMessage }, { status: 400, headers: corsHeaders });
  }
}
