import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req) {
  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env.local");
    }

    const body = await req.json();
    const name = (body?.name || "").trim();
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and password are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters." },
        { status: 400, headers: corsHeaders }
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
        { status: 409, headers: corsHeaders }
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
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error("REGISTER_ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Server error during registration." },
      { status: 500, headers: corsHeaders }
    );
  }
}