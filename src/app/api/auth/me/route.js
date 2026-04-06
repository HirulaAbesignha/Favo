import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({
        ok: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Invalid token'
    }, { status: 401 });
  }
}
