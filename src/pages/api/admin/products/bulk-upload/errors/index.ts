import { wrapHandler } from '@/src/lib/astro-api';

import { getSession } from '@/lib/auth/session';
import { generateErrorReport, type ValidatedRow } from '@/lib/services/excel-import';

async function _POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { errorRows } = body as { errorRows: ValidatedRow[] };

    if (!errorRows || !Array.isArray(errorRows) || errorRows.length === 0) {
      return Response.json({ message: 'No error rows provided.' }, { status: 400 });
    }

    const buffer = generateErrorReport(errorRows);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="bulk_upload_errors_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating error report:', error);
    return Response.json(
      { message: error.message || 'Failed to generate error report' },
      { status: 500 }
    );
  }
}


// Native Astro APIRoute exports
export const POST = wrapHandler(_POST);
