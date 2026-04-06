import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PUT(request, { params }) {
    try {
        const user = verifyToken(request);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const resolvedParams = await params;

        await db.query(
            "UPDATE addresses SET address_line1=?, address_line2=?, city=?, postal_code=?, phone=? WHERE id=?",
            [body.address_line1, body.address_line2, body.city, body.postal_code, body.phone, resolvedParams.id]
        );

        return NextResponse.json({ message: "Address updated successfully" });
    } catch (error) {
        console.error("UPDATE ADDRESS ERROR:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = verifyToken(request);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;

        await db.query("DELETE FROM addresses WHERE id=?", [resolvedParams.id]);

        return NextResponse.json({ message: "Address deleted successfully" });
    } catch (error) {
        console.error("DELETE ADDRESS ERROR:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
