import { APP_CONFIG } from '@/lib/constants/config';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { format } from 'date-fns';

/**
 * Generate a unique invoice number in format: FW-YYYYMMDD-NNNN
 * Uses database sequence to guarantee uniqueness.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  const prefix = `${APP_CONFIG.INVOICE_PREFIX}-${today}-`;

  // Get the count of orders placed today to determine the sequence number
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(sql`invoice_number LIKE ${prefix + '%'}`);

  const count = Number(result[0]?.count ?? 0);
  const sequence = String(count + 1).padStart(4, '0');

  return `${prefix}${sequence}`;
}
