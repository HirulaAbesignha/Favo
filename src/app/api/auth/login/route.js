import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req) {
  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env.local");
    }
    
    const body = await req.json();
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Invalid email format." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find user
    const [rows] = await db.query(
      "SELECT id, email, password_hash, role, is_blocked FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401, headers: corsHeaders }
      );
    }

    // Compare password
    const user = rows[0];

    if (user.is_blocked) {
      return NextResponse.json(
        { ok: false, error: "Account disabled." },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401, headers: corsHeaders }
      );
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      ok: true,
      data: { token, role: user.role, userId: user.id },
    }, { headers: corsHeaders });
  } catch (err) {
    console.error("LOGIN_ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Server error during login." },
      { status: 500, headers: corsHeaders }
    );
  }
}
