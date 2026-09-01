import { z } from 'zod';

// Indian mobile number: 10 digits starting with 6-9
const indianMobileRegex = /^[6-9]\d{9}$/;

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name is too long')
    .trim(),
  mobile: z
    .string()
    .regex(indianMobileRegex, 'Please enter a valid 10-digit Indian mobile number')
    .trim(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export const addressSchema = z.object({
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address is too long')
    .trim(),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City name is too long')
    .trim(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit pincode')
    .trim(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
