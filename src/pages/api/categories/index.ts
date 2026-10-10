import { wrapHandler } from '@/src/lib/astro-api';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

async function _GET() {
  try {
    const categoryList = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: [asc(categories.sortOrder), asc(categories.name)],
    });

    return Response.json(
      { categories: categoryList },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json({ message: 'Failed to load categories' }, { status: 500 });
  }
}


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
