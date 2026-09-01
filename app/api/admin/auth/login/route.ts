import { NextRequest } from 'next/server';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { loginSchema } from '@/lib/validation/admin';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ message: 'Invalid credentials' }, { status: 400 });
    }

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, result.data.email),
    });

    if (!admin) {
      return Response.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(result.data.password, admin.passwordHash);
    if (!valid) {
      return Response.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createSession({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    await setSessionCookie(token);

    return Response.json({
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ message: 'Login failed' }, { status: 500 });
  }
}
