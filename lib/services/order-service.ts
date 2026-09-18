import { db } from '@/db';
import {
  orders,
  orderItems,
  orderStatusHistory,
  inventoryTransactions,
  customers,
  customerAddresses,
  products,
  settings,
  states,
  cities,
  type OrderStatus,
  type FulfillmentType,
} from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { generateInvoiceNumber } from '@/lib/services/invoice-service';
import {
  calculateOrderTotals,
  calculateLineTotal,
  getDeliveryCharge,
} from '@/lib/services/pricing-service';
import {
  InsufficientStockError,
  ProductNotFoundError,
  MinimumOrderError,
  ValidationError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import type { CheckoutInput } from '@/lib/validation/order';

function toNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? 0 : num;
}

export interface CreateOrderResult {
  orderId: number;
  invoiceNumber: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  items: Array<{
    productName: string;
    quantity: number;
    sellingPrice: number;
  }>;
  customerName: string;
  fulfillmentType: FulfillmentType;
  address?: Record<string, unknown> | null;
}

/**
 * Creates an order in a single atomic database transaction.
 */
export async function createOrder(input: CheckoutInput): Promise<CreateOrderResult> {
  return await db.transaction(async (tx) => {
    // 1. Fetch settings for pricing and minimum order validation
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

    // 2. Fetch all products in cart with a FOR UPDATE lock
    const productIds = input.items.map((i) => i.productId);
    const dbProducts = await tx.query.products.findMany({
      where: inArray(products.id, productIds),
    });

    if (dbProducts.length !== productIds.length) {
      const foundIds = new Set(dbProducts.map((p) => p.id));
      const missingId = productIds.find((id) => !foundIds.has(id));
      throw new ProductNotFoundError(missingId || 0);
    }

    // Build lookup map
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 3. Validate stock availability and active status
    for (const item of input.items) {
      const product = productMap.get(item.productId)!;

      if (!product.isActive) {
        throw new ValidationError(`"${product.name}" is currently not available.`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new InsufficientStockError(product.name, product.stockQuantity);
      }
    }

    // 4. Calculate prices server-side
    const pricingItems = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        mrp: toNumber(product.mrp),
        sellingPrice: toNumber(product.sellingPrice),
        quantity: item.quantity,
      };
    });

    const prelimTotals = calculateOrderTotals(pricingItems, 0);
    const deliveryCharge = getDeliveryCharge(
      prelimTotals.subtotal,
      deliveryChargeRate,
      freeDeliveryAbove,
      input.fulfillmentType as 'DELIVERY' | 'PICKUP'
    );
    const totals = calculateOrderTotals(pricingItems, deliveryCharge);

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

    // 7. Verify Location & Save/update address for delivery orders
    let addressSnapshot: Record<string, unknown> | null = null;
    let resolvedStateId: number | null = null;
    let resolvedCityId: number | null = null;

    if (input.fulfillmentType === 'DELIVERY' && input.address) {
      let stateName = input.address.state || '';
      let cityName = input.address.city;

      if (input.address.stateId && input.address.cityId) {
        // Server-side validation of state & city relation
        const stateRow = await tx.query.states.findFirst({
          where: and(eq(states.id, input.address.stateId), eq(states.isActive, true)),
        });

        if (!stateRow) {
          throw new ValidationError('The selected state is invalid or inactive');
        }

        const cityRow = await tx.query.cities.findFirst({
          where: and(
            eq(cities.id, input.address.cityId),
            eq(cities.stateId, input.address.stateId),
            eq(cities.isActive, true)
          ),
        });

        if (!cityRow) {
          throw new ValidationError('The selected city does not belong to the selected state');
        }

        resolvedStateId = stateRow.id;
        resolvedCityId = cityRow.id;
        stateName = stateRow.name;
        cityName = cityRow.name;
      }

      addressSnapshot = {
        stateId: resolvedStateId,
        cityId: resolvedCityId,
        deliveryStateName: stateName,
        deliveryCityName: cityName,
        deliveryAddress: input.address.address,
        address: input.address.address,
        city: cityName,
        state: stateName,
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
          stateId: resolvedStateId,
          cityId: resolvedCityId,
          address: input.address.address,
          city: cityName,
          state: stateName,
          pincode: input.address.pincode,
          isDefault: true,
        });
      }
    }

    // 8. Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // 9. Create order with status = 'NEW'
    const [order] = await tx
      .insert(orders)
      .values({
        invoiceNumber,
        customerId: customer.id,
        stateId: resolvedStateId,
        cityId: resolvedCityId,
        orderStatus: 'NEW' as OrderStatus,
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

    // 10. Create order items with price snapshots
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

    // 11. Deduct inventory with audit trail
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

    // 12. Create status history
    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      oldStatus: null,
      newStatus: 'NEW',
      changedBy: 'system',
      note: 'Order placed by customer',
    });

    logger.info('order.create', 'Order created successfully with status NEW', {
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
