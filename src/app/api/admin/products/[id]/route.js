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
    const { name, description, price, category_id, is_active, collection, sizes, images, is_featured, is_visible, promotional_label } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ ok: false, error: "Name and Price are required" }, { status: 400, headers: corsHeaders });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        "UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, is_active = ?, collection = ?, sizes = ?, is_featured = ?, is_visible = ?, promotional_label = ? WHERE id = ?",
        [name, description || null, parseFloat(price), category_id || null, is_active !== undefined ? is_active : 1, collection || 'CORE COLLECTION', sizes ? JSON.stringify(sizes) : null, is_featured ? 1 : 0, is_visible !== undefined ? is_visible : 1, promotional_label || null, id]
      );

      if (images && Array.isArray(images)) {
        await connection.query("DELETE FROM product_images WHERE product_id = ?", [id]);
        const validImages = images.filter(img => img && img.trim() !== '');
        for (let i = 0; i < validImages.length; i++) {
          await connection.query(
            "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)",
            [id, validImages[i].trim(), i]
          );
        }
      }

      if (sizes && Array.isArray(sizes)) {
        const [existingInventory] = await connection.query(
            "SELECT size FROM inventory WHERE product_id = ?",
            [id]
        );
        const existingSizes = existingInventory.map(row => row.size);
        
        const sizesToAdd = sizes.filter(size => !existingSizes.includes(size.trim()));
        for (const size of sizesToAdd) {
          await connection.query(
            "INSERT INTO inventory (product_id, sku, stock_quantity, low_stock_threshold, size) VALUES (?, ?, ?, ?, ?)",
            [id, null, 0, 10, size.trim()]
          );
        }
        
        const sizesToRemove = existingSizes.filter(size => !sizes.includes(size));
        if (sizesToRemove.length > 0) {
           await connection.query(
               "DELETE FROM inventory WHERE product_id = ? AND size IN (?)",
               [id, sizesToRemove]
           );
        }
      }

      await connection.commit();
      return NextResponse.json({ ok: true, message: "Product updated successfully" }, { headers: corsHeaders });
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
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
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";

    if (force) {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        
        // Remove from inventory, images, and recommendations (ignore if tables don't exist)
        try { await connection.query("DELETE FROM inventory WHERE product_id = ?", [id]); } catch(e) {}
        try { await connection.query("DELETE FROM product_images WHERE product_id = ?", [id]); } catch(e) {}
        try { await connection.query("DELETE FROM product_recommendations WHERE product_id = ? OR recommended_product_id = ?", [id, id]); } catch(e) {}
        
        // Handle orders. We can't delete orders, so we update order_items to null product_id if possible,
        // or just delete the product. If order_items.product_id is not nullable, it will throw.
        try {
          await connection.query("DELETE FROM products WHERE id = ?", [id]);
        } catch (e) {
          if (e.code === 'ER_ROW_IS_REFERENCED_2' || e.message.includes('foreign key constraint fails')) {
            await connection.query("UPDATE order_items SET product_id = NULL WHERE product_id = ?", [id]);
            await connection.query("DELETE FROM products WHERE id = ?", [id]);
          } else {
            throw e;
          }
        }
        
        await connection.commit();
        return NextResponse.json({ ok: true, message: "Product force deleted" }, { headers: corsHeaders });
      } catch (e) {
        await connection.rollback();
        throw e;
      } finally {
        connection.release();
      }
    } else {
      await db.query("DELETE FROM products WHERE id = ?", [id]);
      return NextResponse.json({ ok: true, message: "Product deleted" }, { headers: corsHeaders });
    }
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
