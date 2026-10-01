import * as XLSX from 'xlsx';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { slugify, toNumber } from '@/lib/utils/format';
import { logger } from '@/lib/utils/logger';

export interface RawProductRow {
  [key: string]: any;
}

export interface ParsedProductItem {
  sku: string | null;
  name: string;
  nameTa: string | null;
  description: string | null;
  descriptionTa: string | null;
  categoryNameOrSlug: string;
  categoryId: number;
  categoryName: string;
  piecesPerBox?: number | null;
  boxContent?: number | null;
  contentUnit?: string | null;
  mrp: number;
  discountPercent?: number | null;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrls?: string[];
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;
  isCombo: boolean;
}

export interface ValidatedRow {
  rowNumber: number;
  raw: RawProductRow;
  parsed: ParsedProductItem | null;
  status: 'valid' | 'error';
  isExisting: boolean;
  existingProductId?: number;
  errors: string[];
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  existingCount: number;
  newCount: number;
}

export type DuplicateHandlingMode = 'skip' | 'update' | 'stop';

/**
 * Generate a pre-filled, professional Excel template with instructions and dynamic categories.
 */
export async function generateBulkUploadTemplate(): Promise<Buffer> {
  // Fetch active categories from database
  const dbCategories = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: (categories, { asc }) => [asc(categories.sortOrder), asc(categories.name)],
  });

  const wb = XLSX.utils.book_new();

  // 1. Products Sheet (Template with sample rows)
  const productHeaders = [
    'SKU',
    'Product Name (EN)',
    'Product Name (TA)',
    'Category (Name or Slug)',
    'Box Content',
    'Unit of Content',
    'MRP (₹)',
    'Discount (%)',
    'Selling Price (₹)',
    'Stock Quantity',
    'Low Stock Threshold',
    'Description (EN)',
    'Description (TA)',
    'Featured (TRUE/FALSE)',
    'Bestseller (TRUE/FALSE)',
    'Active (TRUE/FALSE)',
  ];

  const sampleCategory = dbCategories[0]?.name || 'Sparklers';
  const sampleCategory2 = dbCategories[1]?.name || 'Ground Chakkars';
  const sampleCategory3 = dbCategories[2]?.name || 'Rockets';

  const sampleRows = [
    [
      'SKU-SPK-10CM',
      '10cm Electric Sparklers (10 Pcs)',
      '10 செ.மீ எலக்ட்ரிக் கம்பி மத்தாப்பு (10 எண்ணிக்கை)',
      sampleCategory,
      10,
      'Pcs',
      150,
      50,
      75,
      150,
      15,
      'Dazzling golden sparks with low smoke and long burning time. Sivakasi factory made.',
      'புகை குறைந்த, நீண்ட நேரம் எரியும் தங்க நிற கம்பி மத்தாப்பு. சிவகாசி நேரடி தயாரிப்பு.',
      'FALSE',
      'TRUE',
      'TRUE',
    ],
    [
      'SKU-CHK-SPL',
      'Special Deluxe Ground Spinner (10 Pcs)',
      'ஸ்பெஷல் டீலக்ஸ் தரை சக்கரம் (10 எண்ணிக்கை)',
      sampleCategory2,
      10,
      'Pcs',
      280,
      50,
      140,
      80,
      10,
      'High speed spinning ground chakkars with vibrant emerald and ruby sparks.',
      'வேகமாக சுழன்று பல வண்ண தீப்பொறிகளை வெளிப்படுத்தும் தரமான தரை சக்கரம்.',
      'TRUE',
      'TRUE',
      'TRUE',
    ],
    [
      'SKU-RCK-BOMB',
      'Lunik Rocket Super Sonic (10 Pcs)',
      'லுனிக் ராக்கெட் சூப்பர் சோனிக் (10 எண்ணிக்கை)',
      sampleCategory3,
      10,
      'Pcs',
      400,
      50,
      200,
      50,
      10,
      'Soars high into the sky with whistle sound and bursts into golden willow stars.',
      'வானில் உயரே சீறிப்பாய்ந்து பொன்னிற ஒளியுடன் வெடிக்கும் சிறப்பு ராக்கெட்.',
      'FALSE',
      'FALSE',
      'TRUE',
    ],
  ];

  const wsProducts = XLSX.utils.aoa_to_sheet([productHeaders, ...sampleRows]);

  // Set column widths for readability
  wsProducts['!cols'] = [
    { wch: 18 }, // SKU
    { wch: 36 }, // Product Name (EN)
    { wch: 42 }, // Product Name (TA)
    { wch: 24 }, // Category
    { wch: 14 }, // Box Content
    { wch: 16 }, // Unit of Content
    { wch: 12 }, // MRP
    { wch: 14 }, // Discount (%)
    { wch: 18 }, // Selling Price
    { wch: 16 }, // Stock Quantity
    { wch: 20 }, // Low Stock Threshold
    { wch: 45 }, // Description (EN)
    { wch: 45 }, // Description (TA)
    { wch: 22 }, // Featured
    { wch: 22 }, // Bestseller
    { wch: 20 }, // Active
  ];

  XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

  // 2. Instructions Sheet
  const instructionHeaders = ['Column Name', 'Required / Optional', 'Type & Rules', 'Description & Example'];
  const instructionRows = [
    [
      'SKU',
      'Optional (Recommended)',
      'Text (Unique)',
      'Unique stock keeping unit code (e.g. SKU-SPK-10CM). Used for matching duplicate products on updates.',
    ],
    [
      'Product Name (EN)',
      'REQUIRED',
      'Text (Max 255 chars)',
      'English name of the fireworks product. E.g. "10cm Electric Sparklers (10 Pcs)".',
    ],
    [
      'Product Name (TA)',
      'Optional (Recommended)',
      'Text (Tamil)',
      'Tamil name for bilingual store. E.g. "10 செ.மீ எலக்ட்ரிக் கம்பி மத்தாப்பு".',
    ],
    [
      'Category (Name or Slug)',
      'REQUIRED',
      'Text',
      'Must match one of the categories listed in the "Categories" sheet. You can use either Category Name or Slug.',
    ],
    [
      'Box Content',
      'Optional (Default 1)',
      'Integer >= 1',
      'Number of content units inside one box/pack (e.g. 10, 5, 1, 22).',
    ],
    [
      'Unit of Content',
      'Optional (Default Pcs)',
      'Text',
      'Unit measurement of the box content (e.g. "Pcs", "Pieces", "Pack", "Box", "Items", "Rolls"). Displayed to customers as "10 Pcs / Box" or "1 Pack / Box".',
    ],
    [
      'MRP (₹)',
      'REQUIRED',
      'Positive Number',
      'Original Maximum Retail Price printed on box (e.g. 150). Must be greater than 0.',
    ],
    [
      'Discount (%)',
      'Optional',
      'Number (0 - 100)',
      'Discount percentage off MRP (e.g. 50 or 80). If provided without selling price, selling price is auto-calculated.',
    ],
    [
      'Selling Price (₹)',
      'REQUIRED',
      'Positive Number',
      'Discounted wholesale selling price offered to customers (e.g. 75). Must be <= MRP.',
    ],
    [
      'Stock Quantity',
      'Optional',
      'Integer >= 0',
      'Current stock quantity available in Sivakasi warehouse. Defaults to 0 if left empty.',
    ],
    [
      'Low Stock Threshold',
      'Optional',
      'Integer >= 0',
      'Alert threshold for low stock indicator. Defaults to 10 if left empty.',
    ],
    [
      'Description (EN)',
      'Optional',
      'Text',
      'Product details, effect description, safety precautions in English.',
    ],
    [
      'Description (TA)',
      'Optional',
      'Text (Tamil)',
      'Product details and effect description in Tamil.',
    ],
    [
      'Product Images',
      'Upload in Admin',
      'Supabase WebP Storage',
      'Product photos are uploaded directly on each product edit page (optimized & compressed to WebP in Supabase Storage). No image URLs required in Excel.',
    ],
    [
      'Featured (TRUE/FALSE)',
      'Optional',
      'TRUE / FALSE (or Yes / No)',
      'Set to TRUE to display product on the homepage featured section. Defaults to FALSE.',
    ],
    [
      'Bestseller (TRUE/FALSE)',
      'Optional',
      'TRUE / FALSE (or Yes / No)',
      'Set to TRUE to mark product as Bestseller badge. Defaults to FALSE.',
    ],
    [
      'Active (TRUE/FALSE)',
      'Optional',
      'TRUE / FALSE (or Yes / No)',
      'Set to TRUE to make product visible to customers in store. Set to FALSE to hide. Defaults to TRUE.',
    ],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet([instructionHeaders, ...instructionRows]);
  wsInstructions['!cols'] = [
    { wch: 26 },
    { wch: 24 },
    { wch: 28 },
    { wch: 75 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // 3. Categories Sheet
  const categoryHeaders = ['Category ID', 'Category Name (EN)', 'Category Name (TA)', 'Category Slug', 'Status'];
  const categoryRows = dbCategories.map((c) => [
    c.id,
    c.name,
    c.nameTa || '-',
    c.slug,
    c.isActive ? 'Active' : 'Inactive',
  ]);

  const wsCategories = XLSX.utils.aoa_to_sheet([categoryHeaders, ...categoryRows]);
  wsCategories['!cols'] = [
    { wch: 14 },
    { wch: 32 },
    { wch: 32 },
    { wch: 26 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');

  // Generate buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer);
}

/**
 * Normalizes any cell value by converting null/undefined to empty string and trimming.
 */
export function normalizeCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export interface CategoryLookupItem {
  id: number;
  name: string;
  slug: string;
  nameTa?: string | null;
}

/**
 * Resolves a category by Name (case-insensitive), Slug (case-insensitive),
 * Tamil Name, slugified name, or numeric ID.
 */
export function resolveCategory(
  categoryInput: string,
  categoriesList: CategoryLookupItem[]
): CategoryLookupItem | null {
  const value = normalizeCellValue(categoryInput);
  if (!value) return null;

  const lower = value.toLowerCase();
  const slugified = slugify(value).toLowerCase();

  // 1. Direct ID match (if numeric)
  const numericId = parseInt(value, 10);
  if (!isNaN(numericId) && String(numericId) === value) {
    const byId = categoriesList.find((c) => c.id === numericId);
    if (byId) return byId;
  }

  // 2. Exact slug match (case-insensitive)
  const bySlug = categoriesList.find((c) => c.slug.toLowerCase() === lower);
  if (bySlug) return bySlug;

  // 3. Exact name match (case-insensitive)
  const byName = categoriesList.find((c) => c.name.toLowerCase() === lower);
  if (byName) return byName;

  // 4. Tamil name match (if present)
  const byNameTa = categoriesList.find(
    (c) => c.nameTa && c.nameTa.trim().toLowerCase() === lower
  );
  if (byNameTa) return byNameTa;

  // 5. Slugified input vs category slug
  const bySlugified = categoriesList.find(
    (c) => c.slug.toLowerCase() === slugified
  );
  if (bySlugified) return bySlugified;

  // 6. Slugified input vs slugified category name
  const bySlugifiedName = categoriesList.find(
    (c) => slugify(c.name).toLowerCase() === slugified
  );
  if (bySlugifiedName) return bySlugifiedName;

  return null;
}

/**
 * Normalizes column names to key identifiers.
 * Specific compound patterns MUST be evaluated before generic keywords
 * (e.g. "Category (Name or Slug)" must map to "category", not "name").
 */
export function normalizeHeaderKey(header: string): string {
  const clean = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // 1. SKU / Item Code
  if (clean.includes('sku') || clean.includes('itemcode') || clean.includes('productcode') || clean === 'code') return 'sku';

  // 2. Tamil Product Name (MUST be before generic name)
  if (clean.includes('productnameta') || clean.includes('nameta') || clean.includes('tamilname') || clean.includes('tamiltitle')) return 'nameTa';

  // 3. Category (MUST be before generic 'name' because headers like 'Category (Name or Slug)' or 'Category Name' contain 'name')
  if (clean.includes('category') || clean.includes('catname') || clean.includes('catslug') || clean === 'cat') return 'category';

  // 4. Product Name (EN) / Title
  if (clean.includes('productname') || clean.includes('nameen') || clean.includes('producttitle') || clean.includes('name') || clean.includes('title')) return 'name';

  // 5. Tamil Description (MUST be before generic description)
  if (clean.includes('descriptionta') || clean.includes('descta') || clean.includes('tamildesc')) return 'descriptionTa';

  // 6. Description (EN)
  if (clean.includes('description') || clean.includes('desc') || clean.includes('details')) return 'description';

  // 7. Box Content & Packaging count
  if (clean.includes('boxcontent') || clean.includes('boxcount') || clean.includes('piecesperbox') || clean.includes('pieces') || clean.includes('piece') || clean.includes('contentcount')) return 'boxContent';

  // 8. Unit of Content / UOM
  if (clean.includes('unitofcontent') || clean.includes('contentunit') || clean.includes('packunit') || clean.includes('uom') || clean.includes('unit')) return 'contentUnit';

  // 9. Discount percentage
  if (clean.includes('discountpercent') || clean.includes('discountpercentage') || clean.includes('discount')) return 'discountPercent';

  // 10. Low Stock Threshold (MUST be before generic 'stock' because 'lowstockthreshold' contains 'stock')
  if (clean.includes('lowstock') || clean.includes('threshold') || clean.includes('minstock') || clean.includes('alertstock')) return 'lowStockThreshold';

  // 11. Stock Quantity
  if (clean.includes('stockquantity') || clean.includes('stock') || clean.includes('quantity') || clean.includes('qty')) return 'stockQuantity';

  // 12. MRP (Market Price) (MUST be before generic 'price')
  if (clean.includes('mrp') || clean.includes('originalprice') || clean.includes('marketprice') || clean.includes('listprice')) return 'mrp';

  // 13. Selling Price / Offer Price
  if (clean.includes('sellingprice') || clean.includes('offerprice') || clean.includes('discountprice') || clean.includes('saleprice') || clean.includes('price')) return 'sellingPrice';

  // 14. Flags
  if (clean.includes('featured')) return 'isFeatured';
  if (clean.includes('bestseller') || clean.includes('popular')) return 'isBestseller';
  if (clean.includes('active') || clean.includes('status') || clean.includes('published')) return 'isActive';

  return header;
}

/**
 * Parses boolean representations (TRUE/FALSE, Yes/No, 1/0, t/f)
 */
function parseBooleanValue(val: any, defaultVal: boolean = false): boolean {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const str = String(val).trim().toLowerCase();
  if (['true', 'yes', 'y', '1', 't', 'active'].includes(str)) return true;
  if (['false', 'no', 'n', '0', 'f', 'inactive'].includes(str)) return false;
  return defaultVal;
}

/**
 * Parse and validate uploaded Excel file against database
 */
export async function parseAndValidateExcel(fileBuffer: Buffer | ArrayBuffer): Promise<{
  summary: ValidationSummary;
  rows: ValidatedRow[];
}> {
  const wb = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });

  // Look for sheet named "Products" or use the first sheet
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase() === 'products') || wb.SheetNames[0];
  if (!sheetName) {
    throw new Error('No worksheets found in the uploaded Excel file.');
  }

  const ws = wb.Sheets[sheetName];
  const rawRows: RawProductRow[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The worksheet is empty. Please add product rows.');
  }

  // Fetch all active categories
  const dbCategories = await db.query.categories.findMany();
  // Fetch existing products for SKU / Slug mapping
  const existingProducts = await db.query.products.findMany({
    columns: {
      id: true,
      sku: true,
      slug: true,
      name: true,
    },
  });

  const skuMap = new Map<string, number>();
  const slugMap = new Map<string, number>();

  for (const p of existingProducts) {
    if (p.sku) skuMap.set(p.sku.trim().toLowerCase(), p.id);
    if (p.slug) slugMap.set(p.slug.trim().toLowerCase(), p.id);
  }

  const fileSkus = new Set<string>();
  const validatedRows: ValidatedRow[] = [];
  let validCount = 0;
  let errorCount = 0;
  let existingCount = 0;
  let newCount = 0;

  for (let idx = 0; idx < rawRows.length; idx++) {
    const raw = rawRows[idx];
    const rowNumber = idx + 2; // Row 1 is header
    const rowErrors: string[] = [];

    // Map raw headers to normalized fields
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(raw)) {
      const normKey = normalizeHeaderKey(key);
      normalized[normKey] = value;
    }

    // 1. Name EN (Required)
    const name = normalizeCellValue(normalized.name);
    if (!name) {
      rowErrors.push('Product Name (EN) is required.');
    } else if (name.length > 255) {
      rowErrors.push('Product Name (EN) cannot exceed 255 characters.');
    }

    // 2. Name TA (Optional)
    const nameTa = normalized.nameTa ? normalizeCellValue(normalized.nameTa) : null;

    // 3. Category (Required) - Phase 4 & Phase 8 resolution
    const categoryInput = normalizeCellValue(normalized.category);
    let matchedCategory: typeof dbCategories[0] | undefined;

    if (!categoryInput) {
      rowErrors.push('Category is required.');
    } else {
      const resolved = resolveCategory(categoryInput, dbCategories);
      if (!resolved) {
        rowErrors.push(`Category "${categoryInput}" was not found.`);
      } else if (!resolved.id) {
        rowErrors.push(`Category "${categoryInput}" could not be resolved to a category ID.`);
      } else {
        matchedCategory = resolved as typeof dbCategories[0];
      }
    }

    // 4. Pricing & Discount
    const mrp = toNumber(normalized.mrp);
    let sellingPrice = toNumber(normalized.sellingPrice);
    let discountPercent = normalized.discountPercent !== '' && normalized.discountPercent !== undefined
      ? Math.round(toNumber(normalized.discountPercent))
      : undefined;

    if (isNaN(mrp) || mrp <= 0) {
      rowErrors.push('MRP must be a valid positive number greater than 0.');
    }

    if (discountPercent !== undefined && discountPercent >= 0) {
      if (discountPercent > 100) {
        rowErrors.push('Discount (%) cannot exceed 100%.');
      } else if ((isNaN(sellingPrice) || sellingPrice <= 0) && mrp > 0) {
        sellingPrice = Math.round(mrp * (1 - discountPercent / 100) * 100) / 100;
      }
    }

    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      rowErrors.push('Selling Price must be a valid positive number greater than 0.');
    }

    if (mrp > 0 && sellingPrice > 0 && sellingPrice > mrp) {
      rowErrors.push(`Selling Price (₹${sellingPrice}) cannot be greater than MRP (₹${mrp}).`);
    }

    if (discountPercent === undefined && mrp > 0 && sellingPrice > 0) {
      discountPercent = Math.max(0, Math.round(((mrp - sellingPrice) / mrp) * 100));
    }

    // 5. Box Content & Unit of Content
    const boxContentRaw = normalized.boxContent !== undefined && normalized.boxContent !== ''
      ? normalized.boxContent
      : normalized.piecesPerBox;
    const boxContent = boxContentRaw !== '' && boxContentRaw !== undefined
      ? parseInt(String(boxContentRaw), 10)
      : 1;

    if (isNaN(boxContent) || boxContent < 1) {
      rowErrors.push('Box Content must be a positive integer (1 or more).');
    }

    const contentUnit = normalized.contentUnit ? String(normalized.contentUnit).trim() : 'Pcs';

    // 6. Stock & Low Stock (Optional, numeric)
    const stockQuantity = normalized.stockQuantity !== '' && normalized.stockQuantity !== undefined
      ? parseInt(String(normalized.stockQuantity), 10)
      : 0;

    if (isNaN(stockQuantity) || stockQuantity < 0) {
      rowErrors.push('Stock Quantity must be a positive integer (0 or more).');
    }

    const lowStockThreshold = normalized.lowStockThreshold !== '' && normalized.lowStockThreshold !== undefined
      ? parseInt(String(normalized.lowStockThreshold), 10)
      : 10;

    if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      rowErrors.push('Low Stock Threshold must be a positive integer (0 or more).');
    }

    // 6. SKU (Uniqueness check in file)
    const sku = normalized.sku ? String(normalized.sku).trim() : null;
    if (sku) {
      const skuLower = sku.toLowerCase();
      if (fileSkus.has(skuLower)) {
        rowErrors.push(`Duplicate SKU "${sku}" found within this Excel file.`);
      } else {
        fileSkus.add(skuLower);
      }
    }

    // 7. Descriptions
    const description = normalized.description ? String(normalized.description).trim() : null;
    const descriptionTa = normalized.descriptionTa ? String(normalized.descriptionTa).trim() : null;

    // 8. Flags
    const isFeatured = parseBooleanValue(normalized.isFeatured, false);
    const isBestseller = parseBooleanValue(normalized.isBestseller, false);
    const isActive = parseBooleanValue(normalized.isActive, true);

    // 9. Check if exists in DB (by SKU or slug)
    const generatedSlug = slugify(name);
    let isExisting = false;
    let existingProductId: number | undefined;

    if (sku && skuMap.has(sku.toLowerCase())) {
      isExisting = true;
      existingProductId = skuMap.get(sku.toLowerCase());
    } else if (slugMap.has(generatedSlug.toLowerCase())) {
      isExisting = true;
      existingProductId = slugMap.get(generatedSlug.toLowerCase());
    }

    if (isExisting) {
      existingCount++;
    } else {
      newCount++;
    }

    const isValid = rowErrors.length === 0 && Boolean(matchedCategory);

    if (isValid) {
      validCount++;
      validatedRows.push({
        rowNumber,
        raw,
        parsed: {
          sku,
          name,
          nameTa,
          description,
          descriptionTa,
          categoryNameOrSlug: categoryInput,
          categoryId: matchedCategory!.id,
          categoryName: matchedCategory!.name,
          piecesPerBox: boxContent,
          boxContent,
          contentUnit,
          mrp,
          discountPercent: discountPercent ?? 0,
          sellingPrice,
          stockQuantity,
          lowStockThreshold,
          isFeatured,
          isBestseller,
          isActive,
          isCombo: false,
        },
        status: 'valid',
        isExisting,
        existingProductId,
        errors: [],
      });
    } else {
      errorCount++;
      validatedRows.push({
        rowNumber,
        raw,
        parsed: null,
        status: 'error',
        isExisting,
        existingProductId,
        errors: rowErrors,
      });
    }
  }

  return {
    summary: {
      totalRows: rawRows.length,
      validRows: validCount,
      errorRows: errorCount,
      existingCount,
      newCount,
    },
    rows: validatedRows,
  };
}

/**
 * Generate an Excel file containing only the invalid rows along with a clear "Validation Errors" column.
 */
export function generateErrorReport(errorRows: ValidatedRow[]): Buffer {
  const wb = XLSX.utils.book_new();

  const formattedRows = errorRows.map((r) => {
    return {
      'Row Number': r.rowNumber,
      ...r.raw,
      'Validation Errors': r.errors.join('; '),
    };
  });

  const ws = XLSX.utils.json_to_sheet(formattedRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Row Number
    { wch: 18 }, // SKU
    { wch: 35 }, // Name
    { wch: 35 }, // Name TA
    { wch: 22 }, // Category
    { wch: 12 }, // MRP
    { wch: 14 }, // Price
    { wch: 12 }, // Stock
    { wch: 60 }, // Validation Errors
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Errors');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer);
}

/**
 * Execute the database import for valid rows according to duplicate handling mode.
 */
export async function executeBulkProductImport({
  items,
  duplicateMode = 'skip',
  adminEmail,
}: {
  items: ParsedProductItem[];
  duplicateMode: DuplicateHandlingMode;
  adminEmail: string;
}): Promise<{
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ sku?: string | null; name: string; error: string }>;
}> {
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors: Array<{ sku?: string | null; name: string; error: string }> = [];

  // Fetch all existing products for fast lookup
  const existingProducts = await db.query.products.findMany({
    columns: {
      id: true,
      sku: true,
      slug: true,
      name: true,
    },
  });

  const skuMap = new Map<string, number>();
  const slugMap = new Map<string, number>();

  for (const p of existingProducts) {
    if (p.sku) skuMap.set(p.sku.trim().toLowerCase(), p.id);
    if (p.slug) slugMap.set(p.slug.trim().toLowerCase(), p.id);
  }

  // Process in chunks inside transactions
  const chunkSize = 25;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    await db.transaction(async (tx) => {
      for (const item of chunk) {
        try {
          const generatedSlug = slugify(item.name);
          let existingId: number | undefined;

          if (item.sku && skuMap.has(item.sku.toLowerCase())) {
            existingId = skuMap.get(item.sku.toLowerCase());
          } else if (slugMap.has(generatedSlug.toLowerCase())) {
            existingId = slugMap.get(generatedSlug.toLowerCase());
          }

          // Handle existing product
          if (existingId) {
            if (duplicateMode === 'stop') {
              throw new Error(`Duplicate product found with SKU "${item.sku || generatedSlug}". Import stopped.`);
            }

            if (duplicateMode === 'skip') {
              skippedCount++;
              continue;
            }

            if (duplicateMode === 'update') {
              // Update existing product
              await tx
                .update(products)
                .set({
                  name: item.name,
                  nameTa: item.nameTa,
                  categoryId: item.categoryId,
                  description: item.description,
                  descriptionTa: item.descriptionTa,
                  sku: item.sku,
                  piecesPerBox: item.boxContent ?? item.piecesPerBox ?? 1,
                  boxContent: item.boxContent ?? item.piecesPerBox ?? 1,
                  contentUnit: item.contentUnit || 'Pcs',
                  mrp: String(item.mrp),
                  discountPercent: item.discountPercent ?? 0,
                  sellingPrice: String(item.sellingPrice),
                  stockQuantity: item.stockQuantity,
                  lowStockThreshold: item.lowStockThreshold,
                  isActive: item.isActive,
                  isFeatured: item.isFeatured,
                  isBestseller: item.isBestseller,
                  updatedAt: new Date(),
                })
                .where(eq(products.id, existingId));

              updatedCount++;
              continue;
            }
          }

          // Insert new product
          // Ensure slug is globally unique
          let finalSlug = generatedSlug;
          let counter = 1;
          while (slugMap.has(finalSlug.toLowerCase())) {
            finalSlug = `${generatedSlug}-${counter}`;
            counter++;
          }

          const [newProduct] = await tx
            .insert(products)
            .values({
              name: item.name,
              nameTa: item.nameTa,
              slug: finalSlug,
              categoryId: item.categoryId,
              description: item.description,
              descriptionTa: item.descriptionTa,
              sku: item.sku,
              piecesPerBox: item.boxContent ?? item.piecesPerBox ?? 1,
              boxContent: item.boxContent ?? item.piecesPerBox ?? 1,
              contentUnit: item.contentUnit || 'Pcs',
              mrp: String(item.mrp),
              discountPercent: item.discountPercent ?? 0,
              sellingPrice: String(item.sellingPrice),
              stockQuantity: item.stockQuantity,
              lowStockThreshold: item.lowStockThreshold,
              isActive: item.isActive,
              isFeatured: item.isFeatured,
              isBestseller: item.isBestseller,
              isCombo: item.isCombo || false,
            })
            .returning({ id: products.id });

          // Update local maps
          if (item.sku) skuMap.set(item.sku.toLowerCase(), newProduct.id);
          slugMap.set(finalSlug.toLowerCase(), newProduct.id);

          importedCount++;
        } catch (err: any) {
          failedCount++;
          errors.push({
            sku: item.sku,
            name: item.name,
            error: err.message || 'Database insert failed',
          });
          if (duplicateMode === 'stop') {
            throw err;
          }
        }
      }
    });
  }

  logger.info('product.bulkImport', 'Bulk product import completed', {
    total: items.length,
    imported: importedCount,
    updated: updatedCount,
    skipped: skippedCount,
    failed: failedCount,
    adminEmail,
  });

  return {
    success: failedCount === 0 || importedCount > 0 || updatedCount > 0,
    total: items.length,
    imported: importedCount,
    updated: updatedCount,
    skipped: skippedCount,
    failed: failedCount,
    errors,
  };
}
