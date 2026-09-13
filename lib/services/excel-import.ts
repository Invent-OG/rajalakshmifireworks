import * as XLSX from 'xlsx';
import { db } from '@/db';
import { categories, products, productMedia } from '@/db/schema';
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
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrls: string[];
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
    'MRP (₹)',
    'Selling Price (₹)',
    'Stock Quantity',
    'Low Stock Threshold',
    'Description (EN)',
    'Description (TA)',
    'Image URL 1',
    'Image URL 2',
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
      150,
      75,
      150,
      15,
      'Dazzling golden sparks with low smoke and long burning time. Sivakasi factory made.',
      'புகை குறைந்த, நீண்ட நேரம் எரியும் தங்க நிற கம்பி மத்தாப்பு. சிவகாசி நேரடி தயாரிப்பு.',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
      'https://images.unsplash.com/photo-1531747056595-07f6cbbe10ad?w=800',
      'FALSE',
      'TRUE',
      'TRUE',
    ],
    [
      'SKU-CHK-SPL',
      'Special Deluxe Ground Spinner (10 Pcs)',
      'ஸ்பெஷல் டீலக்ஸ் தரை சக்கரம் (10 எண்ணிக்கை)',
      sampleCategory2,
      280,
      140,
      80,
      10,
      'High speed spinning ground chakkars with vibrant emerald and ruby sparks.',
      'வேகமாக சுழன்று பல வண்ண தீப்பொறிகளை வெளிப்படுத்தும் தரமான தரை சக்கரம்.',
      'https://images.unsplash.com/photo-1569429593410-b498b3fb3387?w=800',
      '',
      'TRUE',
      'TRUE',
      'TRUE',
    ],
    [
      'SKU-RCK-BOMB',
      'Lunik Rocket Super Sonic (10 Pcs)',
      'லுனிக் ராக்கெட் சூப்பர் சோனிக் (10 எண்ணிக்கை)',
      sampleCategory3,
      400,
      200,
      50,
      10,
      'Soars high into the sky with whistle sound and bursts into golden willow stars.',
      'வானில் உயரே சீறிப்பாய்ந்து பொன்னிற ஒளியுடன் வெடிக்கும் சிறப்பு ராக்கெட்.',
      'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=800',
      '',
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
    { wch: 12 }, // MRP
    { wch: 18 }, // Selling Price
    { wch: 16 }, // Stock Quantity
    { wch: 20 }, // Low Stock Threshold
    { wch: 45 }, // Description (EN)
    { wch: 45 }, // Description (TA)
    { wch: 40 }, // Image URL 1
    { wch: 40 }, // Image URL 2
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
      'MRP (₹)',
      'REQUIRED',
      'Positive Number',
      'Original Maximum Retail Price printed on box (e.g. 150). Must be greater than 0.',
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
      'Image URL 1 & 2',
      'Optional',
      'Valid URL (http/https)',
      'Direct web image links for product media display. Multiple image URLs will be ordered automatically.',
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
 * Normalizes column names to key identifiers
 */
function normalizeHeaderKey(header: string): string {
  const clean = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (clean.includes('sku') || clean.includes('itemcode') || clean.includes('code')) return 'sku';
  if (clean.includes('productnameta') || clean.includes('nameta') || clean.includes('tamilname')) return 'nameTa';
  if (clean.includes('productname') || clean.includes('nameen') || clean.includes('name') || clean.includes('title')) return 'name';
  if (clean.includes('descriptionta') || clean.includes('descta') || clean.includes('tamildesc')) return 'descriptionTa';
  if (clean.includes('description') || clean.includes('desc')) return 'description';
  if (clean.includes('category')) return 'category';
  if (clean.includes('mrp') || clean.includes('originalprice') || clean.includes('marketprice')) return 'mrp';
  if (clean.includes('sellingprice') || clean.includes('offerprice') || clean.includes('discountprice') || clean.includes('price')) return 'sellingPrice';
  if (clean.includes('stockquantity') || clean.includes('stock') || clean.includes('quantity') || clean.includes('qty')) return 'stockQuantity';
  if (clean.includes('lowstock') || clean.includes('threshold') || clean.includes('minstock')) return 'lowStockThreshold';
  if (clean.includes('imageurl1') || clean.includes('image1') || clean.includes('primaryimage')) return 'imageUrl1';
  if (clean.includes('imageurl2') || clean.includes('image2') || clean.includes('secondaryimage')) return 'imageUrl2';
  if (clean.includes('image') || clean.includes('images') || clean.includes('imageurl')) return 'images';
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
    const name = String(normalized.name || '').trim();
    if (!name) {
      rowErrors.push('Product Name (EN) is required.');
    } else if (name.length > 255) {
      rowErrors.push('Product Name (EN) cannot exceed 255 characters.');
    }

    // 2. Name TA (Optional)
    const nameTa = normalized.nameTa ? String(normalized.nameTa).trim() : null;

    // 3. Category (Required)
    const categoryInput = String(normalized.category || '').trim();
    let matchedCategory: typeof dbCategories[0] | undefined;

    if (!categoryInput) {
      rowErrors.push('Category is required.');
    } else {
      const catLower = categoryInput.toLowerCase();
      // Match by ID, slug, or name (EN or TA)
      matchedCategory = dbCategories.find(
        (c) =>
          String(c.id) === categoryInput ||
          c.slug.toLowerCase() === catLower ||
          c.name.toLowerCase() === catLower ||
          (c.nameTa && c.nameTa.toLowerCase() === catLower) ||
          slugify(c.name) === slugify(categoryInput)
      );

      if (!matchedCategory) {
        rowErrors.push(`Category "${categoryInput}" not found in database. Check "Categories" sheet for valid names.`);
      }
    }

    // 4. MRP & Selling Price (Required, numeric)
    const mrp = toNumber(normalized.mrp);
    const sellingPrice = toNumber(normalized.sellingPrice);

    if (isNaN(mrp) || mrp <= 0) {
      rowErrors.push('MRP must be a valid positive number greater than 0.');
    }

    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      rowErrors.push('Selling Price must be a valid positive number greater than 0.');
    }

    if (mrp > 0 && sellingPrice > 0 && sellingPrice > mrp) {
      rowErrors.push(`Selling Price (₹${sellingPrice}) cannot be greater than MRP (₹${mrp}).`);
    }

    // 5. Stock & Low Stock (Optional, numeric)
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

    // 8. Image URLs
    const imageUrls: string[] = [];
    if (normalized.imageUrl1 && String(normalized.imageUrl1).trim()) {
      imageUrls.push(String(normalized.imageUrl1).trim());
    }
    if (normalized.imageUrl2 && String(normalized.imageUrl2).trim()) {
      imageUrls.push(String(normalized.imageUrl2).trim());
    }
    if (normalized.images && String(normalized.images).trim()) {
      const split = String(normalized.images).split(/[,|\n]/).map((s) => s.trim()).filter(Boolean);
      for (const img of split) {
        if (!imageUrls.includes(img)) imageUrls.push(img);
      }
    }

    // 9. Flags
    const isFeatured = parseBooleanValue(normalized.isFeatured, false);
    const isBestseller = parseBooleanValue(normalized.isBestseller, false);
    const isActive = parseBooleanValue(normalized.isActive, true);

    // 10. Check if exists in DB (by SKU or slug)
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
          mrp,
          sellingPrice,
          stockQuantity,
          lowStockThreshold,
          imageUrls,
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
                  mrp: String(item.mrp),
                  sellingPrice: String(item.sellingPrice),
                  stockQuantity: item.stockQuantity,
                  lowStockThreshold: item.lowStockThreshold,
                  isActive: item.isActive,
                  isFeatured: item.isFeatured,
                  isBestseller: item.isBestseller,
                  updatedAt: new Date(),
                })
                .where(eq(products.id, existingId));

              // If image URLs provided, replace or update product media
              if (item.imageUrls && item.imageUrls.length > 0) {
                // Delete existing images and re-insert
                await tx.delete(productMedia).where(eq(productMedia.productId, existingId));
                for (let sortIdx = 0; sortIdx < item.imageUrls.length; sortIdx++) {
                  await tx.insert(productMedia).values({
                    productId: existingId,
                    type: 'image',
                    url: item.imageUrls[sortIdx],
                    alt: `${item.name} image ${sortIdx + 1}`,
                    sortOrder: sortIdx,
                  });
                }
              }

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
              mrp: String(item.mrp),
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

          // Insert product media images
          if (item.imageUrls && item.imageUrls.length > 0) {
            for (let sortIdx = 0; sortIdx < item.imageUrls.length; sortIdx++) {
              await tx.insert(productMedia).values({
                productId: newProduct.id,
                type: 'image',
                url: item.imageUrls[sortIdx],
                alt: `${item.name} image ${sortIdx + 1}`,
                sortOrder: sortIdx,
              });
            }
          }

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
