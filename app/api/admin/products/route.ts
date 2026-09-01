import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, and, ilike, sql, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { productCreateSchema } from '@/lib/validation/product';
import { slugify } from '@/lib/utils/format';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'));
  const offset = (page - 1) * limit;
  const search = searchParams.get('search')?.trim();
  const categoryId = searchParams.get('categoryId');
  const stockStatus = searchParams.get('stockStatus');

  try {
    const conditions = [];
    if (search) conditions.push(ilike(products.name, `%${search}%`));
    if (categoryId) conditions.push(eq(products.categoryId, parseInt(categoryId)));
    if (stockStatus === 'low') {
      conditions.push(sql`${products.stockQuantity} <= ${products.lowStockThreshold} AND ${products.stockQuantity} > 0`);
    } else if (stockStatus === 'out') {
      conditions.push(eq(products.stockQuantity, 0));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [productList, countResult] = await Promise.all([
      db.query.products.findMany({
        where: whereClause,
        with: {
          category: { columns: { id: true, name: true, slug: true } },
          media: { orderBy: (m, { asc }) => [asc(m.sortOrder)], limit: 1 },
        },
        orderBy: [desc(products.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause),
    ]);

    return Response.json({
      products: productList,
      pagination: { page, limit, total: Number(countResult[0]?.count ?? 0), totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit) },
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return Response.json({ message: 'Failed to load products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = productCreateSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ message: 'Validation failed', errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const slug = slugify(result.data.name);

    // Check slug uniqueness
    const existing = await db.query.products.findFirst({ where: eq(products.slug, slug) });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const [product] = await db.insert(products).values({
      ...result.data,
      slug: finalSlug,
      mrp: String(result.data.mrp),
      sellingPrice: String(result.data.sellingPrice),
    }).returning();

    return Response.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return Response.json({ message: 'Failed to create product' }, { status: 500 });
  }
}
