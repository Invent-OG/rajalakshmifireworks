import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { stockAdjustmentSchema } from '@/lib/validation/admin';
import { adjustStock } from '@/lib/services/inventory-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { productId } = await params;

  try {
    const body = await request.json();
    const result = stockAdjustmentSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ message: 'Validation failed', errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { newStock } = await adjustStock({
      productId: parseInt(productId),
      quantityChange: result.data.quantityChange,
      type: result.data.type,
      note: result.data.note,
      performedBy: session.email,
    });

    return Response.json({ success: true, newStock });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return Response.json({ message: error instanceof Error ? error.message : 'Failed to adjust stock' }, { status: 500 });
  }
}
