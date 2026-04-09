import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in .env.local");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const name = (body?.name || "").trim();
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Check if user exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Email already registered." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')",
      [name, email, passwordHash]
    );

    const token = jwt.sign(
      { userId: result.insertId, role: 'customer' },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      { ok: true, data: { token, role: 'customer', userId: result.insertId } },
      { status: 201 }
    );
  } catch (err) {
    console.error("REGISTER_ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Server error during registration." },
      { status: 500 }
    );
  }
}