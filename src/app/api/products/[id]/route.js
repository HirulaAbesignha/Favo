import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCatalogTableConfig } from '@/lib/catalog';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { stockTable, stockQtyColumn, imageSortColumn } = await getCatalogTableConfig();

    // Get product details
    const [products] = await db.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );

    if (products.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = products[0];

    // Get product images
    const [images] = await db.query(
      `SELECT image_url FROM product_images WHERE product_id = ? ORDER BY ${imageSortColumn}`,
      [id]
    );

    // Get product stock/variants
    const [stock] = await db.query(
      `SELECT id, size, ${stockQtyColumn} AS quantity FROM ${stockTable} WHERE product_id = ? ORDER BY id`,
      [id]
    );

    // Get related products in same category
    const [relatedProducts] = await db.query(
      `SELECT p.id, p.name, p.price 
       FROM products p 
       WHERE p.category_id = ? AND p.id != ? AND p.is_active = TRUE 
       LIMIT 4`,
      [product.category_id, id]
    );

    return NextResponse.json({
      ok: true,
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        category_id: product.category_id,
        category_name: product.category_name,
        images: images.map(img => img.image_url),
        sizes: stock.map(s => ({ id: s.id, size: s.size, quantity: s.quantity })),
        related_products: relatedProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.price)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
