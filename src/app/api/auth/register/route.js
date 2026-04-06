import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    console.log('=== REGISTRATION ATTEMPT ===');
    console.log('Name:', name);
    console.log('Email:', email);

    // Validate input
    if (!name || !email || !password) {
      console.error('Validation failed: Missing required fields');
      return NextResponse.json(
        { ok: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check database connection
    console.log('Checking database connection...');
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not found in environment!');
      return NextResponse.json(
        { ok: false, error: 'Database configuration error' },
        { status: 500 }
      );
    }

    // Check if user already exists
    console.log('Checking if user exists:', email);
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    console.log('Existing users found:', existingUsers?.length || 0);

    if (existingUsers.length > 0) {
      console.error('User already exists');
      return NextResponse.json(
        { ok: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Create user
    console.log('Inserting user into database...');
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'customer']
    );
    console.log('User created with ID:', result.insertId);

    return NextResponse.json(
      { ok: true, data: { userId: result.insertId, name, email } },
      { status: 201 }
    );
  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    return NextResponse.json(
      { ok: false, error: `Registration failed: ${error.message}` },
      { status: 500 }
    );
  }
}
