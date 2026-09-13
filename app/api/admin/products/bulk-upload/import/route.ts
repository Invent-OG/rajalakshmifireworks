import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { executeBulkProductImport, ParsedProductItem, DuplicateHandlingMode } from '@/lib/services/excel-import';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items, duplicateMode = 'skip' } = body as {
      items: ParsedProductItem[];
      duplicateMode?: DuplicateHandlingMode;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ message: 'No valid products to import.' }, { status: 400 });
    }

    const result = await executeBulkProductImport({
      items,
      duplicateMode,
      adminEmail: session.email || 'admin',
    });

    return Response.json(result);
  } catch (error: any) {
    console.error('Error importing bulk products:', error);
    return Response.json(
      { message: error.message || 'Failed to import products to database' },
      { status: 500 }
    );
  }
}
