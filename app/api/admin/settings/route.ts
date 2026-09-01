import { NextRequest } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { settingsUpdateSchema } from '@/lib/validation/admin';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const list = await db.select().from(settings);
    const settingsMap: Record<string, string> = {};
    for (const s of list) {
      settingsMap[s.key] = s.value;
    }
    return Response.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json({ message: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = settingsUpdateSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ message: 'Invalid settings payload' }, { status: 400 });
    }

    const updates = result.data;

    await db.transaction(async (tx) => {
      for (const [key, value] of Object.entries(updates)) {
        const existing = await tx.query.settings.findFirst({
          where: eq(settings.key, key),
        });

        if (existing) {
          await tx
            .update(settings)
            .set({ value: String(value), updatedAt: new Date() })
            .where(eq(settings.key, key));
        } else {
          await tx.insert(settings).values({
            key,
            value: String(value),
          });
        }
      }
    });

    return Response.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return Response.json({ message: 'Failed to save settings' }, { status: 500 });
  }
}
