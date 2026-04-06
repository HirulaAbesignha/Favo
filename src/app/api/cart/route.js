import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { getCatalogTableConfig } from '@/lib/catalog';

async function ensureCartInfrastructure() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cart_id INT NOT NULL,
      product_id INT NOT NULL,
      variant_id INT NULL,
      qty INT NOT NULL DEFAULT 1,
      CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      CONSTRAINT fk_cart_items_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
}

async function ensureCart(userId) {
  await ensureCartInfrastructure();

  const [carts] = await db.query(
    'SELECT id FROM carts WHERE user_id = ? ORDER BY id ASC LIMIT 1',
    [userId]
  );

  if (carts.length > 0) {
    return carts[0].id;
  }

  const [result] = await db.query(
    'INSERT INTO carts (user_id) VALUES (?)',
    [userId]
  );

  return result.insertId;
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { stockTable, stockQtyColumn, imageSortColumn } = await getCatalogTableConfig();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    await ensureCartInfrastructure();

    const [carts] = await db.query(
      'SELECT id FROM carts WHERE user_id = ? ORDER BY id ASC LIMIT 1',
      [user.id]
    );

    if (carts.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          items: [],
          summary: { itemCount: 0, totalQuantity: 0, subtotal: 0 },
        },
      });
    }

    const cartId = carts[0].id;
    const [items] = await db.query(
      `SELECT
        ci.id,
        ci.qty,
        p.id AS product_id,
        p.name,
        p.description,
        p.price,
        stock.id AS variant_id,
        stock.size,
        stock.${stockQtyColumn} AS stock_qty,
        (
          SELECT pi.image_url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.${imageSortColumn} ASC, pi.id ASC
          LIMIT 1
        ) AS image_url
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      LEFT JOIN ${stockTable} stock ON stock.id = ci.variant_id
      WHERE ci.cart_id = ?
      ORDER BY ci.id DESC`,
      [cartId]
    );

    const normalizedItems = items.map((item) => ({
      id: item.id,
      qty: item.qty,
      product: {
        id: item.product_id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        image: item.image_url,
      },
      variant: item.variant_id
        ? {
            id: item.variant_id,
            size: item.size,
            stock_qty: item.stock_qty,
          }
        : null,
      subtotal: parseFloat(item.price) * item.qty,
    }));

    const totalQuantity = normalizedItems.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);

    return NextResponse.json({
      ok: true,
      data: {
        items: normalizedItems,
        summary: {
          itemCount: normalizedItems.length,
          totalQuantity,
          subtotal,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { stockTable, stockQtyColumn } = await getCatalogTableConfig();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { productId, variantId, qty = 1 } = await request.json();

    if (!productId || !variantId || !qty || qty < 1) {
      return NextResponse.json({ ok: false, error: 'Product, variant, and quantity are required' }, { status: 400 });
    }

    const [variants] = await db.query(
      `SELECT id, product_id, size, ${stockQtyColumn} AS stock_qty
       FROM ${stockTable}
       WHERE id = ? AND product_id = ?
       LIMIT 1`,
      [variantId, productId]
    );

    if (variants.length === 0) {
      return NextResponse.json({ ok: false, error: 'Selected size is invalid' }, { status: 400 });
    }

    const variant = variants[0];
    const cartId = await ensureCart(user.id);

    const [existingItems] = await db.query(
      'SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ? LIMIT 1',
      [cartId, productId, variantId]
    );

    const nextQty = (existingItems[0]?.qty || 0) + qty;

    if (nextQty > variant.stock_qty) {
      return NextResponse.json({ ok: false, error: 'Requested quantity exceeds available stock' }, { status: 400 });
    }

    if (existingItems.length > 0) {
      await db.query(
        'UPDATE cart_items SET qty = ? WHERE id = ?',
        [nextQty, existingItems[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO cart_items (cart_id, product_id, variant_id, qty) VALUES (?, ?, ?, ?)',
        [cartId, productId, variantId, qty]
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Added size ${variant.size} to cart`,
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ ok: false, error: 'Failed to add item to cart' }, { status: 500 });
  }
}
