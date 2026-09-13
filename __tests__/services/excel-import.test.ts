import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { generateErrorReport } from '@/lib/services/excel-import';

describe('Excel Bulk Upload Service', () => {
  it('generates an error report Excel workbook containing invalid rows and error reasons', () => {
    const errorRows = [
      {
        rowNumber: 2,
        raw: {
          'Product Name (EN)': 'Invalid Sparkler',
          Category: 'Unknown Category',
          'MRP (₹)': '100',
          'Selling Price (₹)': '120',
        },
        parsed: null,
        status: 'error' as const,
        isExisting: false,
        errors: [
          'Category "Unknown Category" not found in database.',
          'Selling Price (₹120) cannot be greater than MRP (₹100).',
        ],
      },
    ];

    const buffer = generateErrorReport(errorRows as any);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);

    // Read back generated workbook
    const wb = XLSX.read(buffer, { type: 'buffer' });
    expect(wb.SheetNames).toContain('Errors');

    const sheet = wb.Sheets['Errors'];
    const rows = XLSX.utils.sheet_to_json(sheet);
    expect(rows.length).toBe(1);
    expect((rows[0] as any)['Validation Errors']).toContain('Unknown Category');
    expect((rows[0] as any)['Validation Errors']).toContain('cannot be greater than MRP');
  });
});
