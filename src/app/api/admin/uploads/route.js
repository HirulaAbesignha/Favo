import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function sanitizeFileName(fileName) {
  const extension = path.extname(fileName).toLowerCase() || '.jpg';
  const baseName = path.basename(fileName, extension).toLowerCase();
  const safeBaseName = baseName.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product-image';
  return `${safeBaseName}-${randomUUID()}${extension}`;
}

export async function POST(request) {
  try {
    const admin = await requireAdminUser(request);

    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Please choose an image file' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: 'Only JPG, PNG, and WEBP images are allowed' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, error: 'Image must be smaller than 5MB' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'admin-products');
    await mkdir(uploadDir, { recursive: true });

    const fileName = sanitizeFileName(file.name);
    const filePath = path.join(uploadDir, fileName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, fileBuffer);

    return NextResponse.json({
      ok: true,
      data: {
        imageUrl: `/uploads/admin-products/${fileName}`,
      },
    });
  } catch (error) {
    console.error('Error uploading product image:', error);
    return NextResponse.json({ ok: false, error: 'Failed to upload image' }, { status: 500 });
  }
}
