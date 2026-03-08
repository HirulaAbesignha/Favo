import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request,{params}){

 const [rows] = await db.query(
 "SELECT * FROM payments WHERE order_id=?",
 [params.id]
 );

 return NextResponse.json(rows);
}