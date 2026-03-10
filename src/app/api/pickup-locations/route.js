import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT * FROM pickup_locations ORDER BY id DESC"
    );

    return NextResponse.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error("GET PICKUP LOCATIONS ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request){
  const body = await request.json();
  await db.query(
  "INSERT INTO pickup_locations(name,address,phone) VALUES(?,?,?)",
  [body.name,body.address,body.phone]
  );
 
  return NextResponse.json({message:"Pickup location created"});
 }