import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Product ID is required" }, { status: 400, headers: corsHeaders });
    }

    const [rows] = await db.query(`
      SELECT 
        p.*, 
        c.name as category_name, 
        c.gender,
        c.category,
        COALESCE(SUM(i.stock_quantity), 0) as stock_quantity,
        (SELECT JSON_ARRAYAGG(image_url) FROM product_images pi WHERE pi.product_id = p.id) as images,
        (SELECT JSON_OBJECTAGG(size, COALESCE(stock_quantity, 0)) FROM inventory i2 WHERE i2.product_id = p.id) as size_stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404, headers: corsHeaders });
    }

    const row = rows[0];
    let parsedSizes = row.sizes;
    if (typeof parsedSizes === 'string') {
      try { parsedSizes = JSON.parse(parsedSizes); } catch (e) {}
    }
    let parsedImages = row.images;
    if (typeof parsedImages === 'string') {
      try { parsedImages = JSON.parse(parsedImages); } catch (e) {}
    }

    let parsedSizeStock = row.size_stock;
    if (typeof parsedSizeStock === 'string') {
      try { parsedSizeStock = JSON.parse(parsedSizeStock); } catch(e) {}
    } else if (!parsedSizeStock) {
      parsedSizeStock = {};
    }

    const formattedRow = { ...row, sizes: parsedSizes || [], images: parsedImages || [], size_stock: parsedSizeStock };
    
    return NextResponse.json({ ok: true, data: formattedRow }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET PUBLIC PRODUCT ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
