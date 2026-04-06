import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { requireAdminUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdminUser(request);

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const productId = Number.parseInt(id, 10);
    const body = await request.json();

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const categoryId = Number.parseInt(body?.categoryId, 10);
    const price = Number.parseFloat(body?.price);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid product id' }, { status: 400 });
    }

    if (!name || !Number.isInteger(categoryId) || categoryId <= 0 || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Name, category, and a valid price are required' },
        { status: 400 }
      );
    }

    const [categories] = await db.query('SELECT id FROM categories WHERE id = ? LIMIT 1', [categoryId]);

    if (categories.length === 0) {
      return NextResponse.json({ ok: false, error: 'Selected category is invalid' }, { status: 400 });
    }

    const [result] = await db.query(
      'UPDATE products SET name = ?, description = ?, category_id = ?, price = ? WHERE id = ?',
      [name, description, categoryId, price, productId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: productId,
        name,
        description,
        categoryId,
        price,
      },
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdminUser(request);

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const productId = Number.parseInt(id, 10);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid product id' }, { status: 400 });
    }

    const [images] = await db.query(
      'SELECT image_url FROM product_images WHERE product_id = ?',
      [productId]
    );

    const [result] = await db.query('DELETE FROM products WHERE id = ?', [productId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 });
    }

    await Promise.all(
      images
        .filter((image) => typeof image.image_url === 'string' && image.image_url.startsWith('/uploads/admin-products/'))
        .map(async (image) => {
          const filePath = path.join(process.cwd(), 'public', image.image_url.replace(/^\//, ''));
          try {
            await unlink(filePath);
          } catch {
            // Ignore missing files so product deletion still succeeds.
          }
        })
    );

    return NextResponse.json({ ok: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete product' }, { status: 500 });
  }
}
