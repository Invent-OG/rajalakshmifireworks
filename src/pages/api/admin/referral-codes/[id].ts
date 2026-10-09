import { wrapHandler } from '@/src/lib/astro-api';
import { db } from '@/db';
import { referralCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

async function _PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return Response.json({ message: 'Unauthorized' }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return Response.json({ message: 'Invalid referral code ID' }, { status: 400 });
  try {
    const body = await request.json();
    if (typeof body.isActive !== 'boolean') return Response.json({ message: 'isActive must be true or false' }, { status: 400 });
    const [code] = await db.update(referralCodes).set({ isActive: body.isActive, updatedAt: new Date() }).where(eq(referralCodes.id, id)).returning();
    if (!code) return Response.json({ message: 'Referral code not found' }, { status: 404 });
    return Response.json({ code });
  } catch (error) {
    console.error('Failed to update referral code', error);
    return Response.json({ message: 'Failed to update referral code' }, { status: 500 });
  }
}

export const PATCH = wrapHandler(_PATCH);
