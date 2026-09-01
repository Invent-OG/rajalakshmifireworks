import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const categoryList = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: [asc(categories.sortOrder), asc(categories.name)],
    });

    return Response.json({ categories: categoryList });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json({ message: 'Failed to load categories' }, { status: 500 });
  }
}
