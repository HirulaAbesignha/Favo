import pool from "@/lib/backend/db";
import { NextResponse } from "next/server";

const DEFAULT_CART_ID = 1;

// Helper to reliably cast any frontend string to a database-safe integer
function parseCartId(id) {
    if (id === 'guest_cart_1') return 1;
    return parseInt(id) || DEFAULT_CART_ID;
}

function parseVariantId(id) {
    if (id === 'Standard' || id === 'default') return 1;
    return parseInt(id) || 1;
}

export async function PUT(request, { params }) {
    try {
        const paramsAwaited = await params;
        const { id: product_id } = paramsAwaited;

        const body = await request.json();
        const qty = body.qty;

        // Use parsers to map string identifiers (like "guest_cart_1") to valid int
        const cart_id = parseCartId(body.cart_id);
        const variant_id = parseVariantId(body.variant_id);

        await pool.query(
            "UPDATE cart_items SET qty = ? WHERE cart_id = ? AND product_id = ? AND variant_id = ?",
            [qty, cart_id, product_id, variant_id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Cart PUT Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const paramsAwaited = await params;
        const { id: product_id } = paramsAwaited;

        const { searchParams } = new URL(request.url);

        const cart_id = parseCartId(searchParams.get("cart_id"));
        const variant_id = parseVariantId(searchParams.get("variant_id"));

        await pool.query(
            "DELETE FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?",
            [cart_id, product_id, variant_id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Cart DELETE Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
