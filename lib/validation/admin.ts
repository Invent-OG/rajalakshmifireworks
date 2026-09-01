import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const settingsUpdateSchema = z.record(z.string(), z.string());

export const stockAdjustmentSchema = z.object({
  quantityChange: z.number().int().refine((v) => v !== 0, 'Quantity change cannot be 0'),
  type: z.enum(['STOCK_ADDED', 'STOCK_REMOVED', 'MANUAL_ADJUSTMENT']),
  note: z.string().max(500).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
