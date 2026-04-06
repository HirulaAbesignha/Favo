import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request, { params }) {
    try {
        const user = verifyToken(request);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;

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
            try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}

            const filePath = join(uploadDir, fileName);
            await writeFile(filePath, buffer);
            
            image_url = `/uploads/${fileName}`;
        }

        if (!title) {
            return NextResponse.json({ ok: false, error: "Title is required" }, { status: 400 });
        }

        await db.query(
            "UPDATE collections SET title=?, subtitle=?, status=?, display_order=?, section=?, image_url=? WHERE id=?",
            [title, subtitle, status, display_order, section, image_url, id]
        );

        return NextResponse.json({ ok: true, message: "Collection updated successfully", image_url });
    } catch (error) {
        console.error("UPDATE COLLECTION ERROR:", error);
        return NextResponse.json({ ok: false, error: "Server error: " + (error.message || error) }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = verifyToken(request);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;

        await db.query("DELETE FROM collections WHERE id=?", [id]);

        return NextResponse.json({ ok: true, message: "Collection deleted successfully" });
    } catch (error) {
        console.error("DELETE COLLECTION ERROR:", error);
        return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
    }
}
