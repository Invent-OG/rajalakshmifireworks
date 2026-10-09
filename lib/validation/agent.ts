import { z } from 'zod';

const mobileRegex = /^[6-9]\d{9}$/;

export const createAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Agent name must be at least 2 characters')
    .max(255, 'Agent name cannot exceed 255 characters'),
  mobile: z
    .string()
    .trim()
    .regex(mobileRegex, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .nullable(),
  location: z
    .string()
    .trim()
    .max(255, 'Location cannot exceed 255 characters')
    .optional()
    .or(z.literal(''))
    .nullable(),
  agentCode: z
    .string()
    .trim()
    .min(3, 'Agent ID must be at least 3 characters')
    .max(30, 'Agent ID cannot exceed 30 characters')
    .regex(/^[A-Za-z0-9\-_]+$/, 'Agent ID can only contain letters, numbers, hyphens, and underscores')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.toUpperCase() : val)),
  referralCode: z
    .string()
    .trim()
    .min(3, 'Referral code must be at least 3 characters')
    .max(30, 'Referral code cannot exceed 30 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Referral code can only contain letters and numbers')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? val.toUpperCase() : val)),
  joiningDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Agent name must be at least 2 characters')
    .max(255, 'Agent name cannot exceed 255 characters')
    .optional(),
  mobile: z
    .string()
    .trim()
    .regex(mobileRegex, 'Please enter a valid 10-digit Indian mobile number')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .nullable(),
  location: z
    .string()
    .trim()
    .max(255, 'Location cannot exceed 255 characters')
    .optional()
    .or(z.literal(''))
    .nullable(),
  agentCode: z
    .string()
    .trim()
    .min(3, 'Agent ID must be at least 3 characters')
    .max(30, 'Agent ID cannot exceed 30 characters')
    .regex(/^[A-Za-z0-9\-_]+$/, 'Agent ID can only contain letters, numbers, hyphens, and underscores')
    .optional()
    .transform((val) => (val ? val.toUpperCase() : val)),
  referralCode: z
    .string()
    .trim()
    .min(3, 'Referral code must be at least 3 characters')
    .max(30, 'Referral code cannot exceed 30 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Referral code can only contain letters and numbers')
    .optional()
    .transform((val) => (val ? val.toUpperCase() : val)),
  joiningDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const agentFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.enum(['ALL', 'ACTIVE', 'INACTIVE'])
    )
    .default('ALL'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(100).default(25),
  sortBy: z.string().default('createdAt_desc'),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type AgentFilterInput = z.infer<typeof agentFilterSchema>;
