import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection with a simple query
    const [result] = await db.query('SELECT 1 as test');
    
    if (result[0].test === 1) {
      // Try to query users table
      const [tables] = await db.query('SHOW TABLES');
      
      return NextResponse.json({
        ok: true,
        message: 'Database connected successfully',
        tables: tables.length
      });
    } else {
      return NextResponse.json({
        ok: false,
        error: 'Database query failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to connect to database'
    }, { status: 500 });
  }
}
