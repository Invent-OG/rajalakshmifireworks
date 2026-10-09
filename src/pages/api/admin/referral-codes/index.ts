import { wrapHandler } from '@/src/lib/astro-api';
import { db } from '@/db';
import { referralCodes } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

async function _GET() {
  if (!(await getSession())) return Response.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const codes = await db.select().from(referralCodes).orderBy(desc(referralCodes.createdAt));
    return Response.json({ codes });
  } catch (error) {
    console.error('Failed to list referral codes', error);
    return Response.json({ message: 'Failed to load referral codes' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  if (!(await getSession())) return Response.json({ message: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const code = String(body.code || '').trim().toUpperCase();
    const rewardType = body.rewardType === 'FIXED' ? 'FIXED' : 'PERCENT';
    const rewardValue = Number(body.rewardValue);
    const usageLimit = body.usageLimit === '' || body.usageLimit == null ? null : Number(body.usageLimit);
    const minOrderValue = body.minOrderValue === '' || body.minOrderValue == null ? 0 : Number(body.minOrderValue);
    const maxDiscount = body.maxDiscount === '' || body.maxDiscount == null ? null : Number(body.maxDiscount);
    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return Response.json({ message: 'Code must be 3–40 letters, numbers, hyphens, or underscores' }, { status: 400 });
    if (!Number.isFinite(rewardValue) || rewardValue <= 0 || (rewardType === 'PERCENT' && rewardValue > 100)) return Response.json({ message: 'Enter a valid reward (percentage up to 100)' }, { status: 400 });
    if ((usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) || !Number.isFinite(minOrderValue) || minOrderValue < 0 || (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount <= 0))) return Response.json({ message: 'Check usage limit and order amounts' }, { status: 400 });
    if ((startsAt && !Number.isFinite(startsAt.getTime())) || (expiresAt && !Number.isFinite(expiresAt.getTime())) || (startsAt && expiresAt && startsAt >= expiresAt)) return Response.json({ message: 'Check the code validity dates' }, { status: 400 });
    const [created] = await db.insert(referralCodes).values({ code, description: String(body.description || '').trim().slice(0, 255) || null, rewardType, rewardValue: String(rewardValue), maxDiscount: maxDiscount == null ? null : String(maxDiscount), minOrderValue: String(minOrderValue), usageLimit, startsAt, expiresAt, isActive: body.isActive !== false }).returning();
    return Response.json({ code: created }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') return Response.json({ message: 'That referral code already exists' }, { status: 409 });
    console.error('Failed to create referral code', error);
    return Response.json({ message: 'Failed to create referral code' }, { status: 500 });
  }
}

export const GET = wrapHandler(_GET);
export const POST = wrapHandler(_POST);
