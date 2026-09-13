import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { parseAndValidateExcel } from '@/lib/services/excel-import';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ message: 'No Excel file provided.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await parseAndValidateExcel(Buffer.from(arrayBuffer));

    return Response.json({
      success: true,
      summary: result.summary,
      rows: result.rows,
    });
  } catch (error: any) {
    console.error('Error validating bulk upload Excel file:', error);
    return Response.json(
      { message: error.message || 'Failed to process Excel file. Please ensure valid .xlsx format.' },
      { status: 400 }
    );
  }
}
