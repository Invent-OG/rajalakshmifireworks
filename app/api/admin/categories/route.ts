import { NextRequest } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { categoryCreateSchema } from '@/lib/validation/product';
import { slugify } from '@/lib/utils/format';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const list = await db.query.categories.findMany({
      orderBy: [asc(categories.sortOrder), asc(categories.name)],
      with: {
        products: {
          columns: { id: true },
        },
      },
    });

    const categoriesWithCount = list.map((c) => ({
      ...c,
      productCount: c.products.length,
    }));

    return Response.json({ categories: categoriesWithCount });
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return Response.json({ message: 'Failed to load categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = categoryCreateSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const slug = slugify(result.data.name);

    // Check slug uniqueness
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const [category] = await db
      .insert(categories)
      .values({
        name: result.data.name,
        slug: finalSlug,
        description: result.data.description || null,
        image: result.data.image || null,
        sortOrder: result.data.sortOrder,
        isActive: result.data.isActive,
      })
      .returning();

    return Response.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return Response.json({ message: 'Failed to create category' }, { status: 500 });
  }
}
