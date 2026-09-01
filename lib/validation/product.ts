import { z } from 'zod';

export const productMediaItemSchema = z.object({
  id: z.number().optional(),
  type: z.enum(['image', 'video']),
  url: z.string().min(1, 'Media URL is required'),
  alt: z.string().max(255).optional(),
  sortOrder: z.number().int(),
});

export const productBaseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255).trim(),
  categoryId: z.number().int().positive('Please select a category'),
  description: z.string().max(2000).optional(),
  sku: z.string().max(100).optional(),
  mrp: z.number().positive('MRP must be greater than 0'),
  sellingPrice: z.number().positive('Selling price must be greater than 0'),
  stockQuantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isBestseller: z.boolean(),
  media: z.array(productMediaItemSchema).optional(),
});

export const productCreateSchema = productBaseSchema.refine(
  (data) => data.sellingPrice <= data.mrp,
  {
    message: 'Selling price cannot exceed MRP',
    path: ['sellingPrice'],
  }
);

export const productUpdateSchema = productBaseSchema.partial().refine(
  (data) => {
    if (data.sellingPrice !== undefined && data.mrp !== undefined) {
      return data.sellingPrice <= data.mrp;
    }
    return true;
  },
  {
    message: 'Selling price cannot exceed MRP',
    path: ['sellingPrice'],
  }
);

export const bulkPriceUpdateSchema = z
  .object({
    productIds: z.array(z.number().int().positive()).min(1),
    updateType: z.enum(['percentage_increase', 'percentage_decrease', 'fixed_amount', 'direct_price']),
    value: z.number().positive('Value must be positive'),
  })
  .refine(
    (data) => {
      if (data.updateType === 'percentage_increase' || data.updateType === 'percentage_decrease') {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: 'Percentage cannot exceed 100%',
      path: ['value'],
    }
  );

export const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(255).trim(),
  description: z.string().max(1000).optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export type ProductBaseInput = z.infer<typeof productBaseSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type BulkPriceUpdateInput = z.infer<typeof bulkPriceUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
