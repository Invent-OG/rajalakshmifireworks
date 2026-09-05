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

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email cannot exceed 255 characters'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password cannot exceed 100 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
