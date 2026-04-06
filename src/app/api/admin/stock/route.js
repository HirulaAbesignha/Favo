import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCatalogTableConfig } from '@/lib/catalog';
import { requireAdminUser } from '@/lib/auth';

export async function PATCH(request) {
  try {
    const admin = await requireAdminUser(request);

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const { stockTable, stockQtyColumn } = await getCatalogTableConfig();
    const { stockId, quantity } = await request.json();
    const nextQuantity = Number.parseInt(quantity, 10);

    if (!stockId || !Number.isInteger(nextQuantity) || nextQuantity < 0) {
      return NextResponse.json({ ok: false, error: 'A valid stock row and quantity are required' }, { status: 400 });
    }

    const [result] = await db.query(
      `UPDATE ${stockTable} SET ${stockQtyColumn} = ? WHERE id = ?`,
      [nextQuantity, stockId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ ok: false, error: 'Stock record not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update stock' }, { status: 500 });
  }
}
