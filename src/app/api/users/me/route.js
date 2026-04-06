import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rows] = await db.query(
    "SELECT id,name,email,role,created_at FROM users WHERE id=?",
    [user.userId]
  );

  return NextResponse.json(rows[0]);
}

export async function PUT(request) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const name = body.name;
  const password = body.password;

  if (password) {
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET name=?, password_hash=? WHERE id=?",
      [name, hash, user.userId]
    );
  } else {
    await db.query(
      "UPDATE users SET name=? WHERE id=?",
      [name, user.userId]
    );
  }

  return NextResponse.json({ message: "User updated" });
}

export async function DELETE(request) {
  const user = verifyToken(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.query("DELETE FROM users WHERE id=?", [user.userId]);

  return NextResponse.json({ message: "User deleted" });
}