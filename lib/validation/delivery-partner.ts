import { z } from 'zod';

const indianMobileRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;

export const deliveryPartnerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(255, 'Full name is too long')
      .trim()
      .optional(),
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(255, 'Full name is too long')
      .trim()
      .optional(),
    mobileNumber: z
      .string()
      .regex(indianMobileRegex, 'Please enter a valid 10-digit mobile number')
      .trim(),
    email: z
      .string()
      .email('Invalid email address')
      .optional()
      .or(z.literal('')),
    address: z.string().max(500, 'Address is too long').optional().or(z.literal('')),
    pincode: z
      .string()
      .regex(pincodeRegex, 'Please enter a valid 6-digit pincode')
      .optional()
      .or(z.literal('')),
    vehicleType: z.string().max(50, 'Vehicle type is too long').optional().or(z.literal('')),
    vehicleNumber: z.string().max(30, 'Vehicle number is too long').optional().or(z.literal('')),
    notes: z.string().max(1000, 'Notes are too long').optional().or(z.literal('')),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  })
  .refine((data) => !!(data.name || data.fullName), {
    message: 'Full name is required',
    path: ['name'],
  });

export type DeliveryPartnerInput = z.infer<typeof deliveryPartnerSchema>;
