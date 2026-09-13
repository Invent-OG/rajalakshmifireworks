import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { generateBulkUploadTemplate } from '@/lib/services/excel-import';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const buffer = await generateBulkUploadTemplate();

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Rajalakshmi_Fireworks_Bulk_Product_Template.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error generating bulk upload template:', error);
    return Response.json(
      { message: error.message || 'Failed to generate Excel template' },
      { status: 500 }
    );
  }
}
