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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const inStockOnly = searchParams.get("in_stock") === "true";
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const size = searchParams.get("size");
    const sortBy = searchParams.get("sort_by"); // e.g. 'price' or 'newest'
    const order = searchParams.get("order") === "asc" ? "ASC" : "DESC";

    let query = `
      SELECT 
       p.*, 
       c.name as category_name, 
       c.gender,
       c.category,
       COALESCE(SUM(i.stock_quantity), 0) as stock_quantity,
       (SELECT JSON_ARRAYAGG(image_url) FROM product_images pi WHERE pi.product_id = p.id) as images
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_visible = 1 AND p.is_active = 1
    `;

    const queryParams = [];

    if (search) {
      query += ` AND p.name LIKE ?`;
      queryParams.push(`%${search}%`);
    }

    if (category) {
      // Support matching any level of the hierarchy
      query += ` AND (c.name = ? OR c.category = ? OR c.gender = ? OR p.collection = ?)`;
      queryParams.push(category, category, category, category);
    }
    
    if (size) {
      // In MySQL 8+, use JSON_CONTAINS on the JSON array of sizes.
      // E.g., JSON_CONTAINS(p.sizes, '"M"')
      query += ` AND JSON_CONTAINS(p.sizes, ?)`;
      queryParams.push(`"${size}"`);
    }

    query += ` GROUP BY p.id`;

    if (inStockOnly) {
      query += ` HAVING stock_quantity > 0`;
    }

    if (sortBy === 'price') {
      query += ` ORDER BY p.price ${order}`;
    } else {
      query += ` ORDER BY p.is_featured DESC, p.id DESC`;
    }

    const [rows] = await db.query(query, queryParams);

    const formattedRows = rows.map(row => {
      let parsedSizes = row.sizes;
      if (typeof parsedSizes === 'string') {
        try { parsedSizes = JSON.parse(parsedSizes); } catch (e) {}
      }
      let parsedImages = row.images;
      if (typeof parsedImages === 'string') {
        try { parsedImages = JSON.parse(parsedImages); } catch (e) {}
      }
      return { ...row, sizes: parsedSizes || [], images: parsedImages || [] };
    });
    
    return NextResponse.json({ ok: true, data: formattedRows }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET PUBLIC PRODUCTS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
