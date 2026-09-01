import { APP_CONFIG } from '@/lib/constants/config';

/**
 * Format a number as Indian Rupee currency
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${APP_CONFIG.CURRENCY_SYMBOL}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate discount percentage between MRP and selling price
 */
export function calculateDiscountPercent(mrp: number | string, sellingPrice: number | string): number {
  const mrpNum = typeof mrp === 'string' ? parseFloat(mrp) : mrp;
  const priceNum = typeof sellingPrice === 'string' ? parseFloat(sellingPrice) : sellingPrice;
  if (mrpNum <= 0) return 0;
  return Math.round(((mrpNum - priceNum) / mrpNum) * 100);
}

/**
 * Calculate savings amount
 */
export function calculateSavings(mrp: number | string, sellingPrice: number | string): number {
  const mrpNum = typeof mrp === 'string' ? parseFloat(mrp) : mrp;
  const priceNum = typeof sellingPrice === 'string' ? parseFloat(sellingPrice) : sellingPrice;
  return Math.max(0, mrpNum - priceNum);
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Safely parse a numeric string
 */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '…';
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
