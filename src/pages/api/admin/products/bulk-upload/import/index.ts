import { wrapHandler } from '@/src/lib/astro-api';

import { getSession } from '@/lib/auth/session';
import { executeBulkProductImport, type ParsedProductItem, type DuplicateHandlingMode } from '@/lib/services/excel-import';

async function _POST(request: NextRequest) {
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


// Native Astro APIRoute exports
export const POST = wrapHandler(_POST);
