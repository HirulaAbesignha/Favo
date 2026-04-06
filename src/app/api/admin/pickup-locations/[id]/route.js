import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request, { params }) {
    try {
        const body = await request.json();
        const resolvedParams = await params;

        await db.query(
            "UPDATE pickup_locations SET name=?,address=?,phone=? WHERE id=?",
            [body.name, body.address, body.phone, resolvedParams.id]
        );

        return NextResponse.json({ message: "Location updated" });
    } catch (error) {
        console.error("UPDATE ERROR:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const resolvedParams = await params;

        await db.query(
            "DELETE FROM pickup_locations WHERE id=?",
            [resolvedParams.id]
        );

        return NextResponse.json({ message: "Location deleted" });
    } catch (error) {
        console.error("DELETE ERROR:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}