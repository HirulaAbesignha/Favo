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

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const cart_id = parseCartId(searchParams.get("cart_id"));

        // Fetch from database
        const [rows] = await pool.query(
            "SELECT * FROM cart_items WHERE cart_id = ?",
            [cart_id]
        );

        // Enrich with dummy product data since we don't have a products table schema
        const enrichedItems = rows.map((item) => ({
            ...item,
            name: `Premium Product ${item.product_id}`,
            price: Number(item.price) || 2500, // Now dynamic from DB
            image: `https://picsum.photos/seed/${item.product_id}/400/400`,
            description: `Variant: ${item.variant_id || 1}`,
        }));

        return NextResponse.json({ items: enrichedItems });
    } catch (error) {
        console.error("Cart GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const product_id = body.product_id;
        const qty = body.qty || 1;
        const price = body.price || 2500; // Accept dynamic price from other components

        // Parse the frontend string values securely into integers
        const cart_id = parseCartId(body.cart_id);
        const variant_id = parseVariantId(body.variant_id);

        // Check if exists
        const [existing] = await pool.query(
            "SELECT qty FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?",
            [cart_id, product_id, variant_id]
        );

        if (existing.length > 0) {
            await pool.query(
                "UPDATE cart_items SET qty = qty + ? WHERE cart_id = ? AND product_id = ? AND variant_id = ?",
                [qty, cart_id, product_id, variant_id]
            );
        } else {
            await pool.query(
                "INSERT INTO cart_items (cart_id, product_id, variant_id, qty, price) VALUES (?, ?, ?, ?, ?)",
                [cart_id, product_id, variant_id, qty, price]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Cart POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
