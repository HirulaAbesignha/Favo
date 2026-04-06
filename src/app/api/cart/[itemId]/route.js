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

async function getOwnedCartItem(userId, itemId, stockTable, stockQtyColumn) {
  const [items] = await db.query(
    `SELECT ci.id, ci.qty, ci.variant_id, stock.${stockQtyColumn} AS stock_qty
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     LEFT JOIN ${stockTable} stock ON stock.id = ci.variant_id
     WHERE ci.id = ? AND c.user_id = ?
     LIMIT 1`,
    [itemId, userId]
  );

  return items[0] || null;
}

export async function PATCH(request, { params }) {
  try {
    const { itemId } = await params;
    const user = await getAuthenticatedUser(request);
    const { stockTable, stockQtyColumn } = await getCatalogTableConfig();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    await ensureCartInfrastructure();

    const { qty } = await request.json();
    const item = await getOwnedCartItem(user.id, itemId, stockTable, stockQtyColumn);

    if (!item) {
      return NextResponse.json({ ok: false, error: 'Cart item not found' }, { status: 404 });
    }

    if (!qty || qty < 1) {
      await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
      return NextResponse.json({ ok: true, message: 'Item removed from cart' });
    }

    if (item.stock_qty !== null && qty > item.stock_qty) {
      return NextResponse.json({ ok: false, error: 'Requested quantity exceeds available stock' }, { status: 400 });
    }

    await db.query('UPDATE cart_items SET qty = ? WHERE id = ?', [qty, itemId]);

    return NextResponse.json({ ok: true, message: 'Cart item updated' });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update cart item' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { itemId } = await params;
    const user = await getAuthenticatedUser(request);
    const { stockTable, stockQtyColumn } = await getCatalogTableConfig();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    await ensureCartInfrastructure();

    const item = await getOwnedCartItem(user.id, itemId, stockTable, stockQtyColumn);

    if (!item) {
      return NextResponse.json({ ok: false, error: 'Cart item not found' }, { status: 404 });
    }

    await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);

    return NextResponse.json({ ok: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ ok: false, error: 'Failed to remove cart item' }, { status: 500 });
  }
}
