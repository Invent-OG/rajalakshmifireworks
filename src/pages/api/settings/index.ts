import { wrapHandler } from '@/src/lib/astro-api';
import { db } from '@/db';
import { settings } from '@/db/schema';

async function _GET() {
  try {
    const allSettings = await db.select().from(settings);
    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
      settingsMap[s.key] = s.value;
    }
    return Response.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json({ message: 'Failed to load settings' }, { status: 500 });
  }
}


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
