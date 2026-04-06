import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCatalogTableConfig } from '@/lib/catalog';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('q');
    const { stockTable, stockQtyColumn, imageSortColumn } = await getCatalogTableConfig();

    let query = `
      SELECT DISTINCT p.*, c.name as category_name,
      (SELECT COALESCE(SUM(stock.${stockQtyColumn}), 0) FROM ${stockTable} stock WHERE stock.product_id = p.id) as total_stock
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
    `;

    const params = [];

    if (categoryId) {
      query += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [products] = await db.query(query, params);

    if (products.length === 0) {
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    const productIds = products.map((product) => product.id);
    const placeholders = productIds.map(() => '?').join(', ');

    const [allImages] = await db.query(
      `SELECT product_id, image_url
       FROM product_images
       WHERE product_id IN (${placeholders})
       ORDER BY ${imageSortColumn}, id`,
      productIds
    );

    const [allStock] = await db.query(
      `SELECT id, product_id, size, ${stockQtyColumn} AS quantity
       FROM ${stockTable}
       WHERE product_id IN (${placeholders})
       ORDER BY id`,
      productIds
    );

    const imagesByProduct = allImages.reduce((acc, image) => {
      if (!acc[image.product_id]) {
        acc[image.product_id] = [];
      }
      acc[image.product_id].push(image.image_url);
      return acc;
    }, {});

    const stockByProduct = allStock.reduce((acc, item) => {
      if (!acc[item.product_id]) {
        acc[item.product_id] = [];
      }
      acc[item.product_id].push({
        id: item.id,
        size: item.size,
        quantity: item.quantity,
      });
      return acc;
    }, {});

    const productsWithDetails = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      category_id: product.category_id,
      category_name: product.category_name,
      total_stock: product.total_stock || 0,
      images: imagesByProduct[product.id] || [],
      sizes: stockByProduct[product.id] || [],
    }));

    return NextResponse.json({
      ok: true,
      data: productsWithDetails
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
