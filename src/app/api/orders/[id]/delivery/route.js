import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request, context) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const orderId = parseInt(params.id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid order id" },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      "SELECT * FROM addresses WHERE order_id = ?",
      [orderId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    console.error("DELIVERY GET ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request, context) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const orderId = parseInt(params.id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid order id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const addressLine1 = body.addressLine1;
    const addressLine2 = body.addressLine2 || null;
    const city = body.city;
    const postalCode = body.postalCode;
    const phone = body.phone;

    if (!addressLine1 || !city || !postalCode || !phone) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO addresses
      (order_id, address_line1, address_line2, city, postal_code, phone)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, addressLine1, addressLine2, city, postalCode, phone]
    );

    return NextResponse.json({
      ok: true,
      message: "Address added successfully"
    });
  } catch (error) {
    console.error("DELIVERY POST ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const orderId = parseInt(params.id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid order id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const addressLine1 = body.addressLine1;
    const addressLine2 = body.addressLine2 || null;
    const city = body.city;
    const postalCode = body.postalCode;
    const phone = body.phone;

    await db.query(
      `UPDATE addresses
       SET address_line1 = ?, address_line2 = ?, city = ?, postal_code = ?, phone = ?
       WHERE order_id = ?`,
      [addressLine1, addressLine2, city, postalCode, phone, orderId]
    );

    return NextResponse.json({
      ok: true,
      message: "Address updated successfully"
    });
  } catch (error) {
    console.error("DELIVERY PUT ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const orderId = parseInt(params.id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid order id" },
        { status: 400 }
      );
    }

    await db.query(
      "DELETE FROM addresses WHERE order_id = ?",
      [orderId]
    );

    return NextResponse.json({
      ok: true,
      message: "Address deleted successfully"
    });
  } catch (error) {
    console.error("DELIVERY DELETE ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}