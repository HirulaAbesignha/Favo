import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function GET(request) {
  try {
    const user = verifyToken(request);
    
    // Allow reading by anyone or just admins? 
    // Usually admin routes are protected. Let's protect them.
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    const [rows] = await db.query("SELECT * FROM collections ORDER BY display_order ASC, id DESC");
    
    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    console.error("GET COLLECTIONS ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const title = (formData.get('title') || "").toString().trim();
    const subtitle = (formData.get('subtitle') || "").toString().trim();
    const status = (formData.get('status') || "Draft").toString();
    const display_order = parseInt(formData.get('display_order'), 10) || 1;
    const section = (formData.get('section') || "Hero").toString().trim();
    
    let image_url = (formData.get('image_url') || "").toString().trim();
    const file = formData.get('image_file');

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      // Ensure the uploads directory exists
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}

      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      // Store relative path so the frontend backend fetch can append base URL correctly or use directly
      image_url = `/uploads/${fileName}`;
    }

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const [result] = await db.query(
      "INSERT INTO collections (title, subtitle, status, display_order, section, image_url) VALUES (?, ?, ?, ?, ?, ?)",
      [title, subtitle, status, display_order, section, image_url]
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Collection created successfully",
        data: {
          id: result.insertId,
          title,
          subtitle,
          status,
          display_order,
          section,
          image_url
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE COLLECTION ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
