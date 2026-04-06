import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCatalogTableConfig } from '@/lib/catalog';
import { requireAdminUser } from '@/lib/auth';

function normalizeSizeEntries(sizes) {
  if (!Array.isArray(sizes)) {
    return [];
  }

  return sizes
    .map((entry) => ({
      size: typeof entry?.size === 'string' ? entry.size.trim() : '',
      quantity: Number.parseInt(entry?.quantity, 10) || 0,
    }))
    .filter((entry) => entry.size);
}

export async function GET(request) {
  try {
    const admin = await requireAdminUser(request);

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const { stockTable, stockQtyColumn, imageSortColumn } = await getCatalogTableConfig();

    const [products] = await db.query(
      `SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.is_active,
        c.id AS category_id,
        c.name AS category_name,
        COALESCE(SUM(stock.${stockQtyColumn}), 0) AS total_stock
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN ${stockTable} stock ON stock.product_id = p.id
      GROUP BY p.id, p.name, p.description, p.price, p.is_active, c.id, c.name
      ORDER BY p.id DESC`
    );

    if (products.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const productIds = products.map((product) => product.id);
    const placeholders = productIds.map(() => '?').join(', ');

    const [images] = await db.query(
      `SELECT product_id, image_url
       FROM product_images
       WHERE product_id IN (${placeholders})
       ORDER BY ${imageSortColumn}, id`,
      productIds
    );

    const [stockRows] = await db.query(
      `SELECT id, product_id, size, ${stockQtyColumn} AS quantity
       FROM ${stockTable}
       WHERE product_id IN (${placeholders})
       ORDER BY id`,
      productIds
    );

    const imagesByProduct = images.reduce((acc, image) => {
      if (!acc[image.product_id]) {
        acc[image.product_id] = [];
      }

      acc[image.product_id].push(image.image_url);
      return acc;
    }, {});

    const sizesByProduct = stockRows.reduce((acc, item) => {
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

    const data = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      is_active: Boolean(product.is_active),
      category_id: product.category_id,
      category_name: product.category_name,
      total_stock: Number(product.total_stock || 0),
      images: imagesByProduct[product.id] || [],
      sizes: sizesByProduct[product.id] || [],
    }));

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch admin products' }, { status: 500 });
  }
}

export async function POST(request) {
  const connection = await db.getConnection();

  try {
    const admin = await requireAdminUser(request);

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const { stockTable, stockQtyColumn, imageSortColumn } = await getCatalogTableConfig();
    const body = await request.json();

    const name = body?.name?.trim();
    const description = body?.description?.trim() || '';
    const imageUrl = body?.imageUrl?.trim();
    const price = Number.parseFloat(body?.price);
    const categoryId = Number.parseInt(body?.categoryId, 10);
    const sizes = normalizeSizeEntries(body?.sizes);

    if (!name || !imageUrl || !Number.isFinite(price) || price <= 0 || !categoryId || sizes.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Name, category, price, image, and at least one size are required' },
        { status: 400 }
      );
    }

    const [categories] = await connection.query(
      'SELECT id FROM categories WHERE id = ? LIMIT 1',
      [categoryId]
    );

    if (categories.length === 0) {
      return NextResponse.json({ ok: false, error: 'Selected category is invalid' }, { status: 400 });
    }

    await connection.beginTransaction();

    const [productResult] = await connection.query(
      'INSERT INTO products (category_id, name, description, price, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [categoryId, name, description, price]
    );

    const productId = productResult.insertId;

    await connection.query(
      `INSERT INTO product_images (product_id, image_url, ${imageSortColumn}) VALUES (?, ?, 1)`,
      [productId, imageUrl]
    );

    for (const size of sizes) {
      if (stockTable === 'product_variants') {
        await connection.query(
          `INSERT INTO ${stockTable} (product_id, size, ${stockQtyColumn}, sku) VALUES (?, ?, ?, NULL)`,
          [productId, size.size, size.quantity]
        );
      } else {
        await connection.query(
          `INSERT INTO ${stockTable} (product_id, size, ${stockQtyColumn}) VALUES (?, ?, ?)`,
          [productId, size.size, size.quantity]
        );
      }
    }

    await connection.commit();

    return NextResponse.json({
      ok: true,
      data: {
        id: productId,
        name,
      },
      message: 'Product created successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating product:', error);
    return NextResponse.json({ ok: false, error: 'Failed to create product' }, { status: 500 });
  } finally {
    connection.release();
  }
}
