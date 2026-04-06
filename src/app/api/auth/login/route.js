import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password length:', password?.length);

    // Validate input
    if (!email || !password) {
      console.error('Validation failed: Missing email or password');
      return NextResponse.json(
        { ok: false, error: 'Email and password are required' },
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

    // Get user from database
    console.log('Querying database for user:', email);
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    console.log('Users found:', users?.length || 0);

    if (users.length === 0) {
      console.error('User not found in database');
      return NextResponse.json(
        { ok: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];
    console.log('User found, verifying password...');

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.error('Password verification failed');
      return NextResponse.json(
        { ok: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not found in environment!');
      return NextResponse.json(
        { ok: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { userId: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('Token generated successfully');

    // Create response with cookie
    const response = NextResponse.json({
      ok: true,
      data: {
        token,
        role: user.role,
        user: { id: user.id, name: user.name, email: user.email }
      }
    });

    // Set HTTP-only cookie
    console.log('Setting auth cookie...');
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    console.log('=== LOGIN SUCCESSFUL ===');
    return response;
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    return NextResponse.json(
      { ok: false, error: `Login failed: ${error.message}` },
      { status: 500 }
    );
  }
}
