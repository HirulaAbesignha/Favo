import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const user = verifyToken(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Optional: only admin can create pickup locations
    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = (body.name || "").trim();
    const address = (body.address || "").trim();
    const phone = (body.phone || "").trim();

    if (!name || !address || !phone) {
      return NextResponse.json(
        { ok: false, error: "Name, address and phone are required" },
        { status: 400 }
      );
    }

    const [result] = await db.query(
      "INSERT INTO pickup_locations (name, address, phone) VALUES (?, ?, ?)",
      [name, address, phone]
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Pickup location created successfully",
        data: {
          id: result.insertId,
          name,
          address,
          phone
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PICKUP LOCATION ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}