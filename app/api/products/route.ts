import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, and, ilike, sql, desc, asc, lte, gte, AnyColumn, SQLWrapper } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search')?.trim();
    const categorySlug = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    const featured = searchParams.get('featured');
    const bestseller = searchParams.get('bestseller');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Build conditions
    const conditions = [eq(products.isActive, true)];

    if (categorySlug) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, categorySlug),
      });
      if (category) {
        conditions.push(eq(products.categoryId, category.id));
      }
    }

    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    if (featured === 'true') {
      conditions.push(eq(products.isFeatured, true));
    }

    if (bestseller === 'true') {
      conditions.push(eq(products.isBestseller, true));
    }

    if (minPrice) {
      conditions.push(gte(products.sellingPrice, minPrice));
    }

    if (maxPrice) {
      conditions.push(lte(products.sellingPrice, maxPrice));
    }

    // Sort
    let orderBy;
    switch (sort) {
      case 'price_asc':
        orderBy = asc(products.sellingPrice);
        break;
      case 'price_desc':
        orderBy = desc(products.sellingPrice);
        break;
      case 'name_asc':
        orderBy = asc(products.name);
        break;
      case 'name_desc':
        orderBy = desc(products.name);
        break;
      case 'newest':
      default:
        orderBy = desc(products.createdAt);
        break;
    }

    const whereClause = and(...conditions);

    const [productList, countResult] = await Promise.all([
      db.query.products.findMany({
        where: whereClause,
        with: {
          category: { columns: { id: true, name: true, slug: true } },
          media: {
            orderBy: (m: { sortOrder: SQLWrapper | AnyColumn; }) => [asc(m.sortOrder)],
            limit: 1,
          },
        },
        orderBy: () => [orderBy],
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return Response.json({
      products: productList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return Response.json(
      { message: 'Failed to load products' },
      { status: 500 }
    );
  }
}
