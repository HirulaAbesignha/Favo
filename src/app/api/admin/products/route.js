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
    
    // Fetch products along with category name and images
    const [rows] = await db.query(`
      SELECT 
        p.*, 
        c.name as category_name,
        c.gender,
        c.category,
        (SELECT JSON_ARRAYAGG(image_url) FROM product_images pi WHERE pi.product_id = p.id) as images
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);
    
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
    const { name, description, price, category_id, is_active, collection, sizes, images, is_featured, is_visible, promotional_label } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ ok: false, error: "Name and Price are required" }, { status: 400, headers: corsHeaders });
    }
    if (!description || description.trim() === '') {
      return NextResponse.json({ ok: false, error: "Description is required" }, { status: 400, headers: corsHeaders });
    }
    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
      return NextResponse.json({ ok: false, error: "At least one size is required" }, { status: 400, headers: corsHeaders });
    }
    if (!images || !Array.isArray(images) || images.filter(img => img.trim() !== '').length < 2) {
      return NextResponse.json({ ok: false, error: "At least two product photos are required" }, { status: 400, headers: corsHeaders });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        "INSERT INTO products (name, description, price, category_id, is_active, collection, sizes, is_featured, is_visible, promotional_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [name, description, parseFloat(price), category_id || null, is_active !== undefined ? is_active : 1, collection || 'CORE COLLECTION', JSON.stringify(sizes), is_featured ? 1 : 0, is_visible !== undefined ? is_visible : 1, promotional_label || null]
      );
      
      const productId = result.insertId;

      const validImages = images.filter(img => img.trim() !== '');
      for (let i = 0; i < validImages.length; i++) {
        await connection.query(
          "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)",
          [productId, validImages[i].trim(), i]
        );
      }

      for (const size of sizes) {
        await connection.query(
          "INSERT INTO inventory (product_id, sku, stock_quantity, low_stock_threshold, size) VALUES (?, ?, ?, ?, ?)",
          [productId, null, 0, 10, size.trim()]
        );
      }

      await connection.commit();

      return NextResponse.json(
        { ok: true, message: "Product created with base inventory allocations", data: { id: productId, ...body } },
        { status: 201, headers: corsHeaders }
      );
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    return NextResponse.json({ ok: false, error: error.message || "Server error" }, { status: 500, headers: corsHeaders });
  }
}
