import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products, productMedia, comboItems } from '@/db/schema';
import { eq, asc, AnyColumn, SQLWrapper } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { productUpdateSchema } from '@/lib/validation/product';
import { slugify } from '@/lib/utils/format';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, parseInt(id)),
      with: {
        category: true,
        media: { orderBy: (m: { sortOrder: SQLWrapper | AnyColumn }) => [asc(m.sortOrder)] },
        comboItems: {
          with: {
            product: {
              with: {
                media: {
                  orderBy: [asc(productMedia.sortOrder)],
                  limit: 1,
                },
              },
            },
          },
          orderBy: [asc(comboItems.sortOrder)],
        },
      },
    });

    if (!product) return Response.json({ message: 'Product not found' }, { status: 404 });
    return Response.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return Response.json({ message: 'Failed to load product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const productId = parseInt(id);

  try {
    const body = await request.json();
    const result = productUpdateSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (result.data.name) {
      updateData.name = result.data.name;
      updateData.slug = slugify(result.data.name);
    }
    if (result.data.categoryId !== undefined) {
      updateData.categoryId = result.data.categoryId ? Number(result.data.categoryId) : null;
    }
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.sku !== undefined) updateData.sku = result.data.sku;
    if (result.data.mrp !== undefined) updateData.mrp = String(result.data.mrp);
    if (result.data.sellingPrice !== undefined) updateData.sellingPrice = String(result.data.sellingPrice);
    if (result.data.stockQuantity !== undefined) updateData.stockQuantity = result.data.stockQuantity;
    if (result.data.lowStockThreshold !== undefined) updateData.lowStockThreshold = result.data.lowStockThreshold;
    if (result.data.isActive !== undefined) updateData.isActive = result.data.isActive;
    if (result.data.isFeatured !== undefined) updateData.isFeatured = result.data.isFeatured;
    if (result.data.isBestseller !== undefined) updateData.isBestseller = result.data.isBestseller;
    if (result.data.isCombo !== undefined) updateData.isCombo = result.data.isCombo;

    const [updated] = await db.update(products).set(updateData).where(eq(products.id, productId)).returning();

    // Update combo items if provided
    if (result.data.comboItems !== undefined || result.data.isCombo !== undefined) {
      // Remove previous combo items
      await db.delete(comboItems).where(eq(comboItems.comboProductId, productId));

      const isComboActive = result.data.isCombo ?? updated.isCombo;
      const newComboItems = result.data.comboItems;

      if (isComboActive && newComboItems && newComboItems.length > 0) {
        await db.insert(comboItems).values(
          newComboItems.map((ci, idx) => ({
            comboProductId: productId,
            productId: ci.productId,
            quantity: ci.quantity,
            sortOrder: ci.sortOrder ?? idx,
          }))
        );
      }
    }

    return Response.json({ product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    return Response.json({ message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    // Soft delete — set archived
    await db
      .update(products)
      .set({
        isActive: false,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, parseInt(id)));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error archiving product:', error);
    return Response.json({ message: 'Failed to archive product' }, { status: 500 });
  }
}
