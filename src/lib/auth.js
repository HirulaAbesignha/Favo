import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

export async function getAuthenticatedUser(request) {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  let name = decoded.name;

  if (!name && decoded.userId) {
    const [users] = await db.query(
      'SELECT name FROM users WHERE id = ? LIMIT 1',
      [decoded.userId]
    );
    name = users?.[0]?.name;
  }

  return {
    id: decoded.userId,
    name: name || decoded.email,
    email: decoded.email,
    role: decoded.role,
  };
}

export async function requireAdminUser(request) {
  const user = await getAuthenticatedUser(request);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}
