import { wrapHandler } from '@/src/lib/astro-api';

import { db } from '@/db';
import { settings } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { settingsUpdateSchema } from '@/lib/validation/admin';

async function _GET() {
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

async function _PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = settingsUpdateSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ message: 'Invalid settings payload' }, { status: 400 });
    }

    const updates = result.data;
    const entries = Object.entries(updates).map(([key, value]) => ({
      key,
      value: String(value ?? ''),
    }));

    if (entries.length > 0) {
      await db
        .insert(settings)
        .values(entries)
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value: sql`excluded.value`,
            updatedAt: new Date(),
          },
        });
    }

    return Response.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return Response.json({ message: 'Failed to save settings' }, { status: 500 });
  }
}


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
export const PUT = wrapHandler(_PUT);
