import { wrapHandler } from '@/src/lib/astro-api';
import { getCachedCategories } from '@/lib/cache/catalog-cache';

async function _GET() {
  try {
    const categoryList = await getCachedCategories();

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
