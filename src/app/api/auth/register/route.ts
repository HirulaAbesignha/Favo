import { NextResponse } from "next/server";
import bcrypt from  "bcrypt";
import {db} from "@/lib/db";

type RegisterBody = {
    name: string;
    email: string;
    password: string;
};

export async function POST(req: Request) {
    try{
        const body =(await req.json()) as Partial<RegisterBody>;
        const name = (body.name || "").trim();
        const email = (body.email || "").trim().toLowerCase();
        const password = body.password || "";

        //Validation
        if(!name || !email || !password) {
            return NextResponse.json(
                {ok: false, error: "Name, email, and password are required to register."},
                {status: 400}
            );
        }

        if(password.length < 6 ) {
            return NextResponse.json(
                {ok: false, error: "Password must be at least 6 characters."},
                {status: 400}
            );
        }

        //Check if user already exists
        const [existing] = await db.query<any[]>(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                {ok: false, error: "Email already exists."},
                {status: 409}
            )
        }

        //Hash password and  insert
        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await db.query<any[]>(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')",
            [name, email, passwordHash]
        );

        return NextResponse.json(
            {ok: true, data: {userId: (result as any ).insertId}},
            {status: 201}
        );
    }catch (err) {
        console.error("REGISTER_ERROR:", err);
        return NextResponse.json(
            {ok: false, error: "Server error during registration."},
            {status: 500}
        )
    }
}
