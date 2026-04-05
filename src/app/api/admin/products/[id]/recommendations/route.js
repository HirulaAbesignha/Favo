import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request, { params }) {
    try {
        const user = verifyToken(request);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const productId = parseInt(resolvedParams.id, 10);
        if (isNaN(productId)) {
            return NextResponse.json({ ok: false, error: "Invalid product ID" }, { status: 400 });
        }

        let body;
        try {
            body = await request.json();
        } catch(e) {
            return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
        }

        const { recommended_ids } = body;
        if (!Array.isArray(recommended_ids)) {
            return NextResponse.json({ ok: false, error: "recommended_ids must be an array" }, { status: 400 });
        }

        // Validate to ensure product doesn't recommend itself
        if (recommended_ids.includes(productId)) {
            return NextResponse.json({ ok: false, error: "A product cannot recommend itself" }, { status: 400 });
        }

        // Start Transaction
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Clear old recommendations
            await connection.query('DELETE FROM product_recommendations WHERE product_id = ?', [productId]);

            // Insert new recommendations
            if (recommended_ids.length > 0) {
                const values = recommended_ids.map(recId => [productId, recId]);
                await connection.query('INSERT IGNORE INTO product_recommendations (product_id, recommended_product_id) VALUES ?', [values]);
            }

            await connection.commit();
        } catch (trxError) {
            await connection.rollback();
            throw trxError;
        } finally {
            connection.release();
        }

        return NextResponse.json({ ok: true, message: "Recommendations updated successfully" });
    } catch (error) {
        console.error("POST RECOMMENDATIONS ERROR:", error);
        return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
    }
}
