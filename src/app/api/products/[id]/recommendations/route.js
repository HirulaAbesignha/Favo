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
    const productId = parseInt(resolvedParams.id, 10);

    if (isNaN(productId)) {
        return NextResponse.json({ ok: false, error: "Invalid product ID" }, { status: 400, headers: corsHeaders });
    }

    // First, find the category_id of the current product
    const [currentProd] = await db.query('SELECT category_id FROM products WHERE id = ?', [productId]);
    let recommendations = [];

    if (currentProd.length > 0) {
        const { category_id } = currentProd[0];

        // Fetch 4 other products from the exact same category
        const [autoRows] = await db.query(`
            SELECT p.*,
                c.name as category_name,
                (SELECT JSON_ARRAYAGG(image_url) FROM product_images pi WHERE pi.product_id = p.id) as images
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id != ? 
              AND p.is_visible = 1 
              AND p.is_active = 1
              AND p.category_id = ?
            ORDER BY p.is_featured DESC, RAND() 
            LIMIT 4
        `, [productId, category_id]);

        recommendations = autoRows;

        // If for some reason we don't have 4 items in the same category, grab other active items to fill the slots
        if (recommendations.length < 4) {
            const limitMore = 4 - recommendations.length;
            const excludeIds = [productId, ...recommendations.map(r => r.id)];
            const placeholders = excludeIds.map(() => '?').join(',');

            const [fallbackRows] = await db.query(`
                SELECT p.*,
                    c.name as category_name,
                    (SELECT JSON_ARRAYAGG(image_url) FROM product_images pi WHERE pi.product_id = p.id) as images
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id NOT IN (${placeholders}) 
                  AND p.is_visible = 1 
                  AND p.is_active = 1
                ORDER BY p.is_featured DESC, RAND()
                LIMIT ?
            `, [...excludeIds, limitMore]);
            
            recommendations = [...recommendations, ...fallbackRows];
        }
    }

    // Format fields (e.g. sizes and images)
    const formattedRows = recommendations.map(row => {
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
    console.error("GET RECOMMENDATIONS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
