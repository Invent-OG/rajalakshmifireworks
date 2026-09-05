import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products, productMedia, categories } from '@/db/schema';
import { eq, and, ilike, sql, desc, asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { productCreateSchema } from '@/lib/validation/product';
import { slugify } from '@/lib/utils/format';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '25', 10)));
  const offset = (page - 1) * limit;
  const search = searchParams.get('search')?.trim();
  const categoryId = searchParams.get('categoryId');
  const stockFilter = searchParams.get('stockFilter');
  const statusFilter = searchParams.get('statusFilter'); // 'active' | 'inactive' | 'all'
  const sortBy = searchParams.get('sortBy') || 'newest';

  try {
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`})`
      );
    }

    if (categoryId && categoryId !== 'ALL') {
      conditions.push(eq(products.categoryId, parseInt(categoryId, 10)));
    }

    if (statusFilter === 'active') {
      conditions.push(eq(products.isActive, true));
    } else if (statusFilter === 'inactive') {
      conditions.push(eq(products.isActive, false));
    }

    if (stockFilter === 'low') {
      conditions.push(
        sql`${products.stockQuantity} <= ${products.lowStockThreshold} AND ${products.stockQuantity} > 0`
      );
    } else if (stockFilter === 'out') {
      conditions.push(eq(products.stockQuantity, 0));
    } else if (stockFilter === 'in_stock') {
      conditions.push(sql`${products.stockQuantity} > ${products.lowStockThreshold}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting Clause
    let orderClause = [desc(products.createdAt)];
    switch (sortBy) {
      case 'oldest':
        orderClause = [asc(products.createdAt)];
        break;
      case 'name_asc':
        orderClause = [asc(products.name)];
        break;
      case 'name_desc':
        orderClause = [desc(products.name)];
        break;
      case 'price_desc':
        orderClause = [sql`CAST(${products.sellingPrice} AS NUMERIC) DESC`];
        break;
      case 'price_asc':
        orderClause = [sql`CAST(${products.sellingPrice} AS NUMERIC) ASC`];
        break;
      case 'stock_asc':
        orderClause = [asc(products.stockQuantity)];
        break;
      case 'stock_desc':
        orderClause = [desc(products.stockQuantity)];
        break;
      default:
        orderClause = [desc(products.createdAt)];
    }

    // Parallel fetch: paginated products, count, and all categories for dropdown
    const [productList, countResult, allCategories, allProductsStats] = await Promise.all([
      db.query.products.findMany({
        where: whereClause,
        with: {
          category: { columns: { id: true, name: true, slug: true } },
          media: {
            orderBy: [asc(productMedia.sortOrder)],
            limit: 1,
          },
        },
        orderBy: orderClause,
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause),
      db.query.categories.findMany({
        orderBy: [asc(categories.sortOrder), asc(categories.name)],
        columns: { id: true, name: true, slug: true },
      }),
      db.select({
        total: sql<number>`count(*)`,
        inStock: sql<number>`count(*) filter (where ${products.stockQuantity} > ${products.lowStockThreshold})`,
        lowStock: sql<number>`count(*) filter (where ${products.stockQuantity} <= ${products.lowStockThreshold} and ${products.stockQuantity} > 0)`,
        outOfStock: sql<number>`count(*) filter (where ${products.stockQuantity} = 0)`,
        active: sql<number>`count(*) filter (where ${products.isActive} = true)`,
        inactive: sql<number>`count(*) filter (where ${products.isActive} = false)`,
      }).from(products),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const stats = allProductsStats[0] || {
      total: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      active: 0,
      inactive: 0,
    };

    return Response.json({
      products: productList,
      categories: allCategories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total: Number(stats.total),
        inStock: Number(stats.inStock),
        lowStock: Number(stats.lowStock),
        outOfStock: Number(stats.outOfStock),
        active: Number(stats.active),
        inactive: Number(stats.inactive),
      },
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
      return Response.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { media, ...productData } = result.data;
    const slug = slugify(productData.name);

    // Check slug uniqueness
    const existing = await db.query.products.findFirst({ where: eq(products.slug, slug) });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const [product] = await db
      .insert(products)
      .values({
        ...productData,
        slug: finalSlug,
        mrp: String(productData.mrp),
        sellingPrice: String(productData.sellingPrice),
      })
      .returning();

    // Insert associated media if provided
    if (media && media.length > 0) {
      await db.insert(productMedia).values(
        media.map((m, idx) => ({
          productId: product.id,
          type: m.type === 'video' ? 'video' : 'image',
          url: m.url,
          alt: m.alt || product.name,
          sortOrder: m.sortOrder ?? idx,
        }))
      );
    }

    return Response.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return Response.json({ message: 'Failed to create product' }, { status: 500 });
  }
}
