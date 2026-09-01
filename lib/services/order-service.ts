import { db } from '@/db';
import {
  products,
  customers,
  customerAddresses,
  orders,
  orderItems,
  orderStatusHistory,
  inventoryTransactions,
  settings,
} from '@/db/schema';
import type { OrderStatus, FulfillmentType } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { CheckoutInput } from '@/lib/validation/order';
import { generateInvoiceNumber } from './invoice-service';
import { calculateOrderTotals, calculateLineTotal, getDeliveryCharge } from './pricing-service';
import { logger } from '@/lib/utils/logger';
import {
  ValidationError,
  InsufficientStockError,
  MinimumOrderError,
  DuplicateOrderError,
} from '@/lib/utils/errors';
import { toNumber } from '@/lib/utils/format';

interface OrderResult {
  orderId: number;
  invoiceNumber: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    sellingPrice: number;
  }>;
  customerName: string;
  fulfillmentType: FulfillmentType;
  address: { address: string; city: string; pincode: string } | null;
  discountAmount: number;
  deliveryCharge: number;
  subtotal: number;
}

/**
 * Create an order within a database transaction.
 * This is the most critical business operation.
 * 
 * Steps:
 * 1. Check idempotency
 * 2. Validate all products exist and are active
 * 3. Validate stock availability
 * 4. Calculate prices server-side
 * 5. Validate minimum order value
 * 6. Find or create customer
 * 7. Save/update address
 * 8. Create order with snapshots
 * 9. Create order items with price snapshots
 * 10. Deduct inventory with audit trail
 * 11. Create status history
 * 12. Generate invoice number
 */
export async function createOrder(input: CheckoutInput): Promise<OrderResult> {
  // 1. Check idempotency — if order already exists with this key, return it
  if (input.idempotencyKey) {
    const existing = await db.query.orders.findFirst({
      where: eq(orders.idempotencyKey, input.idempotencyKey),
      with: { items: true },
    });

    if (existing) {
      logger.info('order.create', 'Duplicate order detected (idempotency)', {
        idempotencyKey: input.idempotencyKey,
        invoiceNumber: existing.invoiceNumber,
      });
      throw new DuplicateOrderError(existing.invoiceNumber);
    }
  }

  // Execute everything in a transaction
  return await db.transaction(async (tx) => {
    // 2. Fetch and validate all products
    const productIds = input.items.map((item) => item.productId);
    const dbProducts = await tx.query.products.findMany({
      where: and(
        inArray(products.id, productIds),
        eq(products.isActive, true)
      ),
    });

    if (dbProducts.length !== productIds.length) {
      const foundIds = new Set(dbProducts.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new ValidationError(
        `Products not found or inactive: ${missingIds.join(', ')}`,
        'Some products in your cart are no longer available. Please refresh and try again.'
      );
    }

    // Create a lookup map
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 3. Validate stock for each item
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      if (product.stockQuantity < item.quantity) {
        throw new InsufficientStockError(product.name, product.stockQuantity);
      }
    }

    // 4. Calculate prices server-side — NEVER trust client prices
    const itemsForPricing = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        quantity: item.quantity,
      };
    });

    // Get delivery settings
    const settingsRows = await tx
      .select()
      .from(settings)
      .where(
        inArray(settings.key, ['DELIVERY_CHARGE', 'FREE_DELIVERY_ABOVE', 'MIN_ORDER_VALUE'])
      );

    const settingsMap = new Map(settingsRows.map((s) => [s.key, s.value]));
    const deliveryChargeRate = toNumber(settingsMap.get('DELIVERY_CHARGE') ?? '50');
    const freeDeliveryAbove = toNumber(settingsMap.get('FREE_DELIVERY_ABOVE') ?? '2000');
    const minOrderValue = toNumber(settingsMap.get('MIN_ORDER_VALUE') ?? '500');

    // Calculate subtotal first for delivery charge calculation
    const prelimTotals = calculateOrderTotals(itemsForPricing, 0);
    const deliveryCharge = getDeliveryCharge(
      prelimTotals.subtotal,
      deliveryChargeRate,
      freeDeliveryAbove,
      input.fulfillmentType
    );

    const totals = calculateOrderTotals(itemsForPricing, deliveryCharge);

    // 5. Validate minimum order value
    if (totals.subtotal < minOrderValue) {
      throw new MinimumOrderError(minOrderValue, totals.subtotal);
    }

    // 6. Find or create customer
    let customer = await tx.query.customers.findFirst({
      where: eq(customers.mobile, input.customer.mobile),
    });

    if (customer) {
      // Update name if changed
      if (customer.name !== input.customer.name) {
        await tx
          .update(customers)
          .set({ name: input.customer.name, updatedAt: new Date() })
          .where(eq(customers.id, customer.id));
      }
    } else {
      const [newCustomer] = await tx
        .insert(customers)
        .values({
          name: input.customer.name,
          mobile: input.customer.mobile,
          email: input.customer.email || null,
        })
        .returning();
      customer = newCustomer;
    }

    // 7. Save/update address for delivery orders
    let addressSnapshot = null;
    if (input.fulfillmentType === 'DELIVERY' && input.address) {
      addressSnapshot = {
        address: input.address.address,
        city: input.address.city,
        pincode: input.address.pincode,
      };

      // Save to customer addresses for future use
      const existingAddress = await tx.query.customerAddresses.findFirst({
        where: and(
          eq(customerAddresses.customerId, customer.id),
          eq(customerAddresses.pincode, input.address.pincode)
        ),
      });

      if (!existingAddress) {
        await tx.insert(customerAddresses).values({
          customerId: customer.id,
          address: input.address.address,
          city: input.address.city,
          pincode: input.address.pincode,
          isDefault: true,
        });
      }
    }

    // 12. Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // 8. Create order with snapshots
    const [order] = await tx
      .insert(orders)
      .values({
        invoiceNumber,
        customerId: customer.id,
        orderStatus: 'PENDING' as OrderStatus,
        fulfillmentType: input.fulfillmentType,
        subtotal: String(totals.subtotal),
        discountAmount: String(totals.totalDiscount),
        deliveryCharge: String(totals.deliveryCharge),
        totalAmount: String(totals.grandTotal),
        customerNameSnapshot: input.customer.name,
        customerMobileSnapshot: input.customer.mobile,
        addressSnapshot: addressSnapshot,
        notes: input.notes || null,
        idempotencyKey: input.idempotencyKey || null,
        placedAt: new Date(),
      })
      .returning();

    // 9. Create order items with price snapshots
    const orderItemValues = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const mrp = toNumber(product.mrp);
      const sellingPrice = toNumber(product.sellingPrice);
      const lineTotal = calculateLineTotal(sellingPrice, item.quantity);

      return {
        orderId: order.id,
        productId: item.productId,
        productNameSnapshot: product.name,
        productSkuSnapshot: product.sku,
        mrpSnapshot: String(mrp),
        sellingPriceSnapshot: String(sellingPrice),
        quantity: item.quantity,
        discountPerUnit: String(mrp - sellingPrice),
        lineTotal: String(lineTotal),
      };
    });

    await tx.insert(orderItems).values(orderItemValues);

    // 10. Deduct inventory with audit trail
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      const newStock = product.stockQuantity - item.quantity;

      // Update stock quantity on product
      await tx
        .update(products)
        .set({
          stockQuantity: newStock,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));

      // Record inventory transaction
      await tx.insert(inventoryTransactions).values({
        productId: item.productId,
        type: 'ORDER_RESERVED',
        quantityChange: -item.quantity,
        quantityAfter: newStock,
        referenceId: order.id,
        referenceType: 'order',
        note: `Order ${invoiceNumber}`,
        performedBy: 'system',
      });
    }

    // 11. Create status history
    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      oldStatus: null,
      newStatus: 'PENDING',
      changedBy: 'system',
      note: 'Order placed',
    });

    logger.info('order.create', 'Order created successfully', {
      orderId: order.id,
      invoiceNumber,
      customerId: customer.id,
      totalAmount: totals.grandTotal,
      itemCount: input.items.length,
    });

    return {
      orderId: order.id,
      invoiceNumber,
      totalAmount: totals.grandTotal,
      subtotal: totals.subtotal,
      discountAmount: totals.totalDiscount,
      deliveryCharge: totals.deliveryCharge,
      items: input.items.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          productName: product.name,
          quantity: item.quantity,
          sellingPrice: toNumber(product.sellingPrice),
        };
      }),
      customerName: input.customer.name,
      fulfillmentType: input.fulfillmentType as FulfillmentType,
      address: addressSnapshot,
    };
  });
}

/**
 * Restore inventory when an order is cancelled
 */
export async function restoreInventoryForOrder(orderId: number, cancelledBy: string): Promise<void> {
  await db.transaction(async (tx) => {
    const items = await tx.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });

    for (const item of items) {
      // Get current stock
      const product = await tx.query.products.findFirst({
        where: eq(products.id, item.productId),
      });

      if (!product) continue;

      const newStock = product.stockQuantity + item.quantity;

      await tx
        .update(products)
        .set({ stockQuantity: newStock, updatedAt: new Date() })
        .where(eq(products.id, item.productId));

      await tx.insert(inventoryTransactions).values({
        productId: item.productId,
        type: 'ORDER_CANCELLED',
        quantityChange: item.quantity,
        quantityAfter: newStock,
        referenceId: orderId,
        referenceType: 'order',
        note: `Order cancelled by ${cancelledBy}`,
        performedBy: cancelledBy,
      });
    }

    logger.info('order.cancel', 'Inventory restored for cancelled order', {
      orderId,
      itemCount: items.length,
      cancelledBy,
    });
  });
}
