import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdminUser } from '@/lib/auth';

export async function GET() {
  try {
    const [categories] = await db.query(
      `SELECT c.id, c.name, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
       GROUP BY c.id, c.name
       ORDER BY c.name ASC`
    );

    return NextResponse.json({
      ok: true,
      data: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        product_count: Number(cat.product_count || 0),
      })),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdminUser(request);

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const { name } = await request.json();
    const categoryName = typeof name === 'string' ? name.trim() : '';

    if (!categoryName) {
      return NextResponse.json({ ok: false, error: 'Category name is required' }, { status: 400 });
    }

    const [existing] = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1', [categoryName]);

    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: 'Category already exists' }, { status: 409 });
    }

    const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [categoryName]);

    return NextResponse.json({
      ok: true,
      data: {
        id: result.insertId,
        name: categoryName,
        product_count: 0,
      },
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ ok: false, error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireAdminUser(request);

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id, name } = await request.json();
    const categoryId = Number.parseInt(id, 10);
    const categoryName = typeof name === 'string' ? name.trim() : '';

    if (!Number.isInteger(categoryId) || categoryId <= 0 || !categoryName) {
      return NextResponse.json({ ok: false, error: 'Valid category id and name are required' }, { status: 400 });
    }

    const [existing] = await db.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1',
      [categoryName, categoryId]
    );

    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: 'Another category already uses that name' }, { status: 409 });
    }

    const [result] = await db.query('UPDATE categories SET name = ? WHERE id = ?', [categoryName, categoryId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ ok: false, error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: categoryId,
        name: categoryName,
      },
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update category' }, { status: 500 });
  }
}
