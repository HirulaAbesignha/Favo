import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request,{params}){

 const body = await request.json();

 await db.query(
 "UPDATE pickup_locations SET name=?,address=?,phone=? WHERE id=?",
 [body.name,body.address,body.phone,params.id]
 );

 return NextResponse.json({message:"Location updated"});
}

export async function DELETE(request,{params}){

 await db.query(
 "DELETE FROM pickup_locations WHERE id=?",
 [params.id]
 );

 return NextResponse.json({message:"Location deleted"});
}