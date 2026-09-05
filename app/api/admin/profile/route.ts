import { NextRequest } from 'next/server';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { eq, ne, and } from 'drizzle-orm';
import { requireSession, createSession, setSessionCookie } from '@/lib/auth/session';
import { updateProfileSchema } from '@/lib/validation/admin';

export async function GET() {
  try {
    const session = await requireSession();

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, session.id),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return Response.json({ message: 'User account not found' }, { status: 404 });
    }

    return Response.json({ user: admin });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching admin profile:', error);
    return Response.json({ message: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message || 'Invalid profile data' },
        { status: 400 }
      );
    }

    const { name, email } = parsed.data;

    // Check if the new email is already used by another admin account
    const existingUser = await db.query.adminUsers.findFirst({
      where: and(
        eq(adminUsers.email, email),
        ne(adminUsers.id, session.id)
      ),
    });

    if (existingUser) {
      return Response.json(
        { message: 'This email address is already in use by another account' },
        { status: 409 }
      );
    }

    // Update profile
    const [updatedAdmin] = await db
      .update(adminUsers)
      .set({
        name,
        email,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, session.id))
      .returning({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        role: adminUsers.role,
        updatedAt: adminUsers.updatedAt,
      });

    if (!updatedAdmin) {
      return Response.json({ message: 'Account not found' }, { status: 404 });
    }

    // Re-issue JWT session token with the updated name and email
    const newToken = await createSession({
      id: updatedAdmin.id,
      email: updatedAdmin.email,
      name: updatedAdmin.name,
      role: updatedAdmin.role,
    });
    await setSessionCookie(newToken);

    return Response.json({
      message: 'Profile updated successfully',
      user: updatedAdmin,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating profile:', error);
    return Response.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}
