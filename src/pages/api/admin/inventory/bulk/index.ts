import { wrapHandler, type NextRequest } from '@/src/lib/astro-api';
import { getSession } from '@/lib/auth/session';
import { bulkStockAdjustmentSchema } from '@/lib/validation/admin';
import { bulkAdjustStock, generateBulkStockTemplate } from '@/lib/services/inventory-service';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { ValidationError } from '@/lib/utils/errors';

async function _GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get('action');

  try {
    if (action === 'template') {
      const buffer = await generateBulkStockTemplate();
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition':
            'attachment; filename="Rajalakshmi_Fireworks_Stock_Update_Template.xlsx"',
        },
      });
    }

    // Default: Return list of active products with current stock for bulk tool lookup
    const activeProducts = await db.query.products.findMany({
      where: eq(products.isActive, true),
      columns: {
        id: true,
        sku: true,
        name: true,
        stockQuantity: true,
        lowStockThreshold: true,
      },
      with: {
        category: { columns: { name: true } },
      },
      orderBy: [products.name],
    });

    return Response.json({ products: activeProducts });
  } catch (error: any) {
    logger.error('admin.inventory.bulk.get', 'Error in bulk inventory GET', {
      error: error?.message,
    });
    return Response.json(
      { message: error?.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function _POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bulkStockAdjustmentSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await bulkAdjustStock({
      mode: parsed.data.mode,
      quantity: parsed.data.quantity,
      defaultNote: parsed.data.defaultNote,
      items: parsed.data.items,
      performedBy: session.email,
    });

    return Response.json({
      success: true,
      updatedCount: result.updatedCount,
      totalRequested: result.totalRequested,
      results: result.results,
    });
  } catch (error) {
    logger.error('admin.inventory.bulk', 'Bulk inventory update failed', {
      error: error instanceof Error ? error.message : String(error),
      adminEmail: session?.email,
    });

    if (error instanceof ValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }

    return Response.json(
      { message: error instanceof Error ? error.message : 'Failed to update stock in bulk' },
      { status: 500 }
    );
  }
}

export const GET = wrapHandler(_GET);
export const POST = wrapHandler(_POST);
