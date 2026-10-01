import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  generateErrorReport,
  resolveCategory,
  normalizeHeaderKey,
  normalizeCellValue,
  type CategoryLookupItem,
} from '@/lib/services/excel-import';

const mockCategories: CategoryLookupItem[] = [
  { id: 1, name: 'Sparklers', slug: 'sparklers', nameTa: 'கம்பி மத்தாப்பு' },
  { id: 2, name: 'Flower Pots', slug: 'flower-pots', nameTa: 'பூந்தொட்டி' },
  { id: 3, name: 'Rockets', slug: 'rockets', nameTa: 'ராக்கெட்' },
  { id: 4, name: 'Chakras', slug: 'chakras', nameTa: 'சக்கரம்' },
  { id: 5, name: 'Fountains', slug: 'fountains', nameTa: 'பவுண்டன் / ஃபேன்ஸி' },
  { id: 6, name: 'Sound Crackers', slug: 'sound-crackers', nameTa: 'வெடி & சரவெடி' },
  { id: 7, name: 'Gift Boxes', slug: 'gift-boxes', nameTa: 'கிஃப்ட் பாக்ஸ்' },
  { id: 8, name: 'Family Packs', slug: 'family-packs', nameTa: 'பேமிலி காம்போ பேக்' },
];

describe('Excel Bulk Upload Service', () => {
  describe('Header Normalization', () => {
    it('correctly maps "Category (Name or Slug)" to "category" without confusing with "name"', () => {
      expect(normalizeHeaderKey('Category (Name or Slug)')).toBe('category');
      expect(normalizeHeaderKey('Category Name')).toBe('category');
      expect(normalizeHeaderKey('Category Slug')).toBe('category');
      expect(normalizeHeaderKey('category_name')).toBe('category');
      expect(normalizeHeaderKey('categoryName')).toBe('category');
      expect(normalizeHeaderKey('category')).toBe('category');
      expect(normalizeHeaderKey('Category')).toBe('category');
    });

    it('correctly maps product names, prices, and stock threshold without collision', () => {
      expect(normalizeHeaderKey('Product Name (EN)')).toBe('name');
      expect(normalizeHeaderKey('Product Name (TA)')).toBe('nameTa');
      expect(normalizeHeaderKey('MRP (₹)')).toBe('mrp');
      expect(normalizeHeaderKey('Selling Price (₹)')).toBe('sellingPrice');
      expect(normalizeHeaderKey('Stock Quantity')).toBe('stockQuantity');
      expect(normalizeHeaderKey('Low Stock Threshold')).toBe('lowStockThreshold');
      expect(normalizeHeaderKey('Box Content')).toBe('boxContent');
      expect(normalizeHeaderKey('Unit of Content')).toBe('contentUnit');
    });
  });

  describe('Category Resolution (resolveCategory)', () => {
    it('resolves category by English name', () => {
      expect(resolveCategory('Sparklers', mockCategories)).toEqual(
        expect.objectContaining({ id: 1, name: 'Sparklers', slug: 'sparklers' })
      );
      expect(resolveCategory('Flower Pots', mockCategories)).toEqual(
        expect.objectContaining({ id: 2, name: 'Flower Pots', slug: 'flower-pots' })
      );
      expect(resolveCategory('Rockets', mockCategories)).toEqual(
        expect.objectContaining({ id: 3, name: 'Rockets', slug: 'rockets' })
      );
    });

    it('resolves category by slug (lowercase and case-insensitive)', () => {
      expect(resolveCategory('sparklers', mockCategories)).toEqual(
        expect.objectContaining({ id: 1, name: 'Sparklers', slug: 'sparklers' })
      );
      expect(resolveCategory('flower-pots', mockCategories)).toEqual(
        expect.objectContaining({ id: 2, name: 'Flower Pots', slug: 'flower-pots' })
      );
      expect(resolveCategory('rockets', mockCategories)).toEqual(
        expect.objectContaining({ id: 3, name: 'Rockets', slug: 'rockets' })
      );
      expect(resolveCategory('sound-crackers', mockCategories)).toEqual(
        expect.objectContaining({ id: 6, name: 'Sound Crackers', slug: 'sound-crackers' })
      );
      expect(resolveCategory('gift-boxes', mockCategories)).toEqual(
        expect.objectContaining({ id: 7, name: 'Gift Boxes', slug: 'gift-boxes' })
      );
    });

    it('resolves category with whitespace around value', () => {
      expect(resolveCategory('   sparklers   ', mockCategories)).toEqual(
        expect.objectContaining({ id: 1 })
      );
      expect(resolveCategory('   Flower Pots   ', mockCategories)).toEqual(
        expect.objectContaining({ id: 2 })
      );
    });

    it('resolves category by Tamil name', () => {
      expect(resolveCategory('கம்பி மத்தாப்பு', mockCategories)).toEqual(
        expect.objectContaining({ id: 1 })
      );
    });

    it('resolves category by numeric string ID', () => {
      expect(resolveCategory('1', mockCategories)).toEqual(
        expect.objectContaining({ id: 1, name: 'Sparklers' })
      );
    });

    it('returns null for empty category input', () => {
      expect(resolveCategory('', mockCategories)).toBeNull();
      expect(resolveCategory('   ', mockCategories)).toBeNull();
      expect(resolveCategory(null as any, mockCategories)).toBeNull();
      expect(resolveCategory(undefined as any, mockCategories)).toBeNull();
    });

    it('returns null for unknown category input', () => {
      expect(resolveCategory('unknown-firework', mockCategories)).toBeNull();
      expect(resolveCategory('9999', mockCategories)).toBeNull();
    });
  });

  describe('Error Report Generation', () => {
    it('generates an error report Excel workbook containing invalid rows and error reasons', () => {
      const errorRows = [
        {
          rowNumber: 2,
          raw: {
            'Product Name (EN)': 'Invalid Sparkler',
            'Category (Name or Slug)': 'Unknown Category',
            'MRP (₹)': '100',
            'Selling Price (₹)': '120',
          },
          parsed: null,
          status: 'error' as const,
          isExisting: false,
          errors: [
            'Category "Unknown Category" was not found.',
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
});
