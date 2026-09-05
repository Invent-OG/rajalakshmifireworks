import { NextRequest } from 'next/server';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { changePasswordSchema } from '@/lib/validation/admin';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message || 'Invalid password data' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, session.id),
    });

    if (!admin) {
      return Response.json({ message: 'User account not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isCurrentPasswordValid) {
      return Response.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Ensure new password is not identical to current
    const isSamePassword = await verifyPassword(newPassword, admin.passwordHash);
    if (isSamePassword) {
      return Response.json(
        { message: 'New password cannot be the same as your current password' },
        { status: 400 }
      );
    }

    // Hash the new password and update in database
    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(adminUsers)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, session.id));

    return Response.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error changing password:', error);
    return Response.json({ message: 'Failed to update password' }, { status: 500 });
  }
}
