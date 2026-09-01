import { NextRequest } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { categoryUpdateSchema } from '@/lib/validation/product';
import { slugify } from '@/lib/utils/format';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const categoryId = parseInt(id);

  try {
    const body = await request.json();
    const result = categoryUpdateSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (result.data.name !== undefined) {
      updateData.name = result.data.name;
      updateData.slug = slugify(result.data.name);
    }
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.image !== undefined) updateData.image = result.data.image;
    if (result.data.sortOrder !== undefined) updateData.sortOrder = result.data.sortOrder;
    if (result.data.isActive !== undefined) updateData.isActive = result.data.isActive;

    const [updated] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning();

    return Response.json({ category: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    return Response.json({ message: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const categoryId = parseInt(id);

  try {
    // Check if category has products
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
      with: { products: true },
    });

    if (!category) {
      return Response.json({ message: 'Category not found' }, { status: 404 });
    }

    if (category.products.length > 0) {
      // Soft disable if it has products
      await db
        .update(categories)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(categories.id, categoryId));
      return Response.json({
        message: 'Category disabled because it has associated products.',
      });
    }

    await db.delete(categories).where(eq(categories.id, categoryId));
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return Response.json({ message: 'Failed to delete category' }, { status: 500 });
  }
}
