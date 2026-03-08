import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request,{params}){

 const body = await request.json();

 await db.query(
 "UPDATE payments SET status=? WHERE id=?",
 [body.status,params.id]
 );

 return NextResponse.json({message:"Payment updated"});
}

export async function DELETE(request,{params}){

 await db.query(
 "DELETE FROM payments WHERE id=?",
 [params.id]
 );

 return NextResponse.json({message:"Payment deleted"});
}