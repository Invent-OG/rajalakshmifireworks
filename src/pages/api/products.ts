import { wrapHandler } from '@/src/lib/astro-api';
import { getCachedAllActiveProducts, getCachedCategories } from '@/lib/cache/catalog-cache';

async function _GET(request: any) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search')?.trim().toLowerCase();
    const categorySlug = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    const featured = searchParams.get('featured');
    const bestseller = searchParams.get('bestseller');
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
    const combo = searchParams.get('combo') || searchParams.get('isCombo');

    const [allProducts, allCategories] = await Promise.all([
      getCachedAllActiveProducts(),
      categorySlug ? getCachedCategories() : Promise.resolve([]),
    ]);

    let filtered = allProducts;

    if (categorySlug) {
      const cat = allCategories.find((c: any) => c.slug === categorySlug);
      if (cat) {
        filtered = filtered.filter((p: any) => p.categoryId === cat.id);
      } else {
        filtered = [];
      }
    }

    if (search) {
      filtered = filtered.filter((p: any) =>
        (p.name && p.name.toLowerCase().includes(search)) ||
        (p.nameTa && p.nameTa.toLowerCase().includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.descriptionTa && p.descriptionTa.toLowerCase().includes(search))
      );
    }

    if (combo === 'true') {
      filtered = filtered.filter((p: any) => {
        const catName = (p.category?.name || '').toLowerCase();
        const catSlug = (p.category?.slug || '').toLowerCase();
        return Boolean(
          p.isCombo ||
          catName === 'combo' ||
          catName === 'gift box' ||
          catName.includes('combo') ||
          catName.includes('gift') ||
          catSlug.includes('combo') ||
          catSlug.includes('gift')
        );
      });
    }

    if (featured === 'true') {
      filtered = filtered.filter((p: any) => Boolean(p.isFeatured));
    }

    if (bestseller === 'true') {
      filtered = filtered.filter((p: any) => Boolean(p.isBestseller));
    }

    if (minPrice !== null && !isNaN(minPrice)) {
      filtered = filtered.filter((p: any) => Number(p.sellingPrice) >= minPrice);
    }

    if (maxPrice !== null && !isNaN(maxPrice)) {
      filtered = filtered.filter((p: any) => Number(p.sellingPrice) <= maxPrice);
    }

    // Sort in-memory
    const sorted = [...filtered].sort((a: any, b: any) => {
      switch (sort) {
        case 'price_asc':
          return Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0);
        case 'price_desc':
          return Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0);
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    const total = sorted.length;
    const paginated = sorted.slice(offset, offset + limit);

    return Response.json(
      {
        products: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return Response.json(
      { message: 'Failed to load products' },
      { status: 500 }
    );
  }
}


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
