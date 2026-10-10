import { wrapHandler, type NextRequest } from '@/src/lib/astro-api';

import { db } from '@/db';
import {
  orders,
  orderItems,
  orderStatusHistory,
  orderDeliveryAssignments,
  whatsappMessages,
  customers,
  products,
  inventoryTransactions,
} from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { validateTransition, getStatusTimestampField } from '@/lib/services/order-status-machine';
import { restoreInventoryForOrder } from '@/lib/services/order-service';
import { whatsAppService } from '@/lib/whatsapp/service';
import type { WhatsAppMessageType } from '@/lib/whatsapp/types';
import { logger } from '@/lib/utils/logger';
import type { OrderStatus, FulfillmentType } from '@/db/schema';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId) || orderId <= 0) {
    return Response.json({ message: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
        customer: true,
        state: true,
        city: true,
        deliveryPartner: true,
        deliveryAssignments: {
          orderBy: [desc(orderDeliveryAssignments.createdAt)],
          with: {
            deliveryPartner: true,
          },
        },
        statusHistory: {
          orderBy: [desc(orderStatusHistory.createdAt)],
        },
        whatsappMessages: {
          orderBy: [desc(whatsappMessages.createdAt)],
        },
      },
    });

    if (!order) {
      return Response.json({ message: 'Order not found' }, { status: 404 });
    }

    return Response.json({ order });
  } catch (error) {
    console.error('Error fetching order detail:', error);
    return Response.json({ message: 'Failed to load order' }, { status: 500 });
  }
}

async function _PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId) || orderId <= 0) {
    return Response.json({ message: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Fetch current order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return Response.json({ message: 'Order not found' }, { status: 404 });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    let statusChanged = false;
    let paymentChanged = false;
    const currentStatus = order.orderStatus as OrderStatus;
    const fulfillmentType = order.fulfillmentType as FulfillmentType;
    const newStatus = body.newStatus as OrderStatus | undefined;

    // Handle order status transition
    if (newStatus && newStatus !== currentStatus) {
      const error = validateTransition(currentStatus, newStatus, fulfillmentType);
      if (error) {
        return Response.json({ message: error }, { status: 400 });
      }

      updateData.orderStatus = newStatus;
      const tsField = getStatusTimestampField(newStatus);
      if (tsField) {
        updateData[tsField] = now;
      }
      statusChanged = true;
    }

    // Handle payment status update
    if (body.paymentStatus !== undefined && body.paymentStatus !== order.paymentStatus) {
      paymentChanged = true;
      updateData.paymentStatus = body.paymentStatus;

      if (body.paymentStatus === 'PAID') {
        updateData.paidAt = now;
        updateData.paidBy = session.email;
        updateData.paymentMethod = body.paymentMethod || order.paymentMethod || 'UPI';
        updateData.paymentReference = body.paymentReference !== undefined ? body.paymentReference : (order.paymentReference || null);
      } else if (body.paymentStatus === 'PENDING') {
        updateData.paidAt = null;
        updateData.paidBy = null;
        updateData.paymentReference = null;
      }
    } else {
      if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
      if (body.paymentReference !== undefined) updateData.paymentReference = body.paymentReference;
    }

    // 1. Handle Customer Details Update
    let customerDetailsChanged = false;
    if (body.customerDetails && typeof body.customerDetails === 'object') {
      const cd = body.customerDetails;
      const currentAddress = (order.addressSnapshot as any) || {};
      const updatedAddress = {
        ...currentAddress,
        deliveryAddress: cd.deliveryAddress !== undefined ? cd.deliveryAddress : currentAddress.deliveryAddress,
        deliveryCityName: cd.deliveryCityName !== undefined ? cd.deliveryCityName : currentAddress.deliveryCityName,
        deliveryStateName: cd.deliveryStateName !== undefined ? cd.deliveryStateName : currentAddress.deliveryStateName,
        pincode: cd.pincode !== undefined ? cd.pincode : currentAddress.pincode,
      };

      if (cd.name) updateData.customerNameSnapshot = String(cd.name).trim();
      if (cd.mobile) updateData.customerMobileSnapshot = String(cd.mobile).trim();
      if (cd.notes !== undefined) updateData.notes = cd.notes ? String(cd.notes).trim() : null;
      updateData.addressSnapshot = updatedAddress;
      customerDetailsChanged = true;
    }

    // 2. Handle Order Items Alteration (Add, Remove, Quantity adjustments)
    let itemsChanged = false;
    let computedSubtotal = parseFloat(String(order.subtotal)) || 0;
    let computedTotal = parseFloat(String(order.totalAmount)) || 0;

    if (Array.isArray(body.items)) {
      const newItems = body.items;
      if (newItems.length === 0) {
        return Response.json({ message: 'Order must contain at least one product' }, { status: 400 });
      }
      itemsChanged = true;
    }

    // 3. Handle Delivery Charge and Discount adjustments when items are not altered
    if (!itemsChanged) {
      if (body.deliveryCharge !== undefined) {
        updateData.deliveryCharge = parseFloat(String(body.deliveryCharge)).toFixed(2);
      }
      if (body.discountAmount !== undefined) {
        updateData.discountAmount = parseFloat(String(body.discountAmount)).toFixed(2);
      }
      if (body.deliveryCharge !== undefined || body.discountAmount !== undefined) {
        const sub = parseFloat(String(order.subtotal)) || 0;
        const del = body.deliveryCharge !== undefined ? parseFloat(String(body.deliveryCharge)) || 0 : parseFloat(String(order.deliveryCharge)) || 0;
        const disc = body.discountAmount !== undefined ? parseFloat(String(body.discountAmount)) || 0 : 0;
        updateData.totalAmount = Math.max(0, sub + del - disc).toFixed(2);
      }
    }

    if (
      !statusChanged &&
      !paymentChanged &&
      !customerDetailsChanged &&
      !itemsChanged &&
      Object.keys(updateData).length <= 1
    ) {
      return Response.json({ success: true, message: 'No changes required' });
    }

    await db.transaction(async (tx) => {
      // Reconcile and replace order items if requested
      if (itemsChanged && Array.isArray(body.items)) {
        const newItems = body.items;

        // Fetch existing order items for inventory adjustments
        const existingItems = await tx.query.orderItems.findMany({
          where: eq(orderItems.orderId, orderId),
        });

        const oldQtyMap = new Map<number, number>();
        for (const it of existingItems) {
          oldQtyMap.set(it.productId, (oldQtyMap.get(it.productId) || 0) + it.quantity);
        }

        const newQtyMap = new Map<number, number>();
        for (const it of newItems) {
          const pid = Number(it.productId);
          const q = Math.max(1, parseInt(String(it.quantity), 10) || 1);
          newQtyMap.set(pid, (newQtyMap.get(pid) || 0) + q);
        }

        // Adjust stock quantities and record inventory transactions
        const allProductIds = new Set([...oldQtyMap.keys(), ...newQtyMap.keys()]);
        for (const pid of allProductIds) {
          const oldQ = oldQtyMap.get(pid) || 0;
          const newQ = newQtyMap.get(pid) || 0;
          const diff = newQ - oldQ; // positive = reserved more, negative = returned to stock

          if (diff !== 0) {
            const prod = await tx.query.products.findFirst({
              where: eq(products.id, pid),
            });
            if (prod) {
              const updatedStock = Math.max(0, prod.stockQuantity - diff);
              await tx
                .update(products)
                .set({ stockQuantity: updatedStock, updatedAt: now })
                .where(eq(products.id, pid));

              await tx.insert(inventoryTransactions).values({
                productId: pid,
                type: diff > 0 ? 'ORDER_RESERVED' : 'STOCK_ADDED',
                quantityChange: -diff,
                quantityAfter: updatedStock,
                referenceId: orderId,
                referenceType: 'order',
                note: `Order #${order.invoiceNumber} altered by admin (${diff > 0 ? `+${diff}` : diff} qty)`,
                performedBy: session.email,
              });
            }
          }
        }

        // Remove old order items and insert updated items
        await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));

        let runningSubtotal = 0;
        const insertRows = newItems.map((item: any) => {
          const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1);
          const mrp = parseFloat(String(item.mrpSnapshot ?? item.mrp ?? 0)) || 0;
          const sell = parseFloat(String(item.sellingPriceSnapshot ?? item.sellingPrice ?? 0)) || 0;
          const discountPerUnit = Math.max(0, mrp - sell);
          const lineTotal = parseFloat((qty * sell).toFixed(2));
          runningSubtotal += lineTotal;

          return {
            orderId,
            productId: Number(item.productId),
            productNameSnapshot: String(item.productNameSnapshot || item.name || 'Product'),
            productSkuSnapshot: item.productSkuSnapshot || item.sku || null,
            mrpSnapshot: mrp.toFixed(2),
            sellingPriceSnapshot: sell.toFixed(2),
            quantity: qty,
            discountPerUnit: discountPerUnit.toFixed(2),
            lineTotal: lineTotal.toFixed(2),
          };
        });

        await tx.insert(orderItems).values(insertRows);

        computedSubtotal = runningSubtotal;
        const deliveryCharge =
          body.deliveryCharge !== undefined
            ? parseFloat(String(body.deliveryCharge)) || 0
            : parseFloat(String(updateData.deliveryCharge || order.deliveryCharge)) || 0;
        const additionalDiscount =
          body.discountAmount !== undefined
            ? Math.max(0, parseFloat(String(body.discountAmount)) || 0)
            : 0;
        computedTotal = Math.max(0, computedSubtotal + deliveryCharge - additionalDiscount);

        updateData.subtotal = computedSubtotal.toFixed(2);
        updateData.deliveryCharge = deliveryCharge.toFixed(2);
        updateData.discountAmount = additionalDiscount.toFixed(2);
        updateData.totalAmount = computedTotal.toFixed(2);

        await tx.insert(orderStatusHistory).values({
          orderId,
          oldStatus: currentStatus,
          newStatus: currentStatus,
          changedBy: session.email,
          note: `Order items modified by admin (${insertRows.length} items, Total: ₹${computedTotal.toFixed(2)})`,
        });
      }

      // Update customer table if customer details were changed
      if (customerDetailsChanged && order.customerId) {
        const cd = body.customerDetails;
        const customerUpdates: Record<string, any> = { updatedAt: now };
        if (cd.name) customerUpdates.name = String(cd.name).trim();
        if (cd.mobile) customerUpdates.mobile = String(cd.mobile).trim();
        if (cd.email !== undefined) customerUpdates.email = cd.email ? String(cd.email).trim() : null;

        await tx.update(customers).set(customerUpdates).where(eq(customers.id, order.customerId));

        await tx.insert(orderStatusHistory).values({
          orderId,
          oldStatus: currentStatus,
          newStatus: currentStatus,
          changedBy: session.email,
          note: `Customer contact & shipping details updated by admin`,
        });
      }

      // Update order record
      await tx
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId));

      // Record status change in history
      if (statusChanged && newStatus) {
        await tx.insert(orderStatusHistory).values({
          orderId,
          oldStatus: currentStatus,
          newStatus,
          changedBy: session.email,
          note: body.note || null,
        });
      }

      // Record payment status change in history
      if (paymentChanged) {
        const payMethod = updateData.paymentMethod || body.paymentMethod || 'UPI';
        const payRef = updateData.paymentReference || body.paymentReference;
        const paymentNote =
          body.paymentStatus === 'PAID'
            ? `Payment Recorded: Marked as PAID via ${payMethod}${payRef ? ` (Ref: ${payRef})` : ''}`
            : 'Payment status updated to PENDING';

        await tx.insert(orderStatusHistory).values({
          orderId,
          oldStatus: newStatus || currentStatus,
          newStatus: newStatus || currentStatus,
          changedBy: session.email,
          note: paymentNote,
        });
      }
    });

    // Restore inventory if cancelled
    if (statusChanged && newStatus === 'CANCELLED') {
      await restoreInventoryForOrder(orderId, session.email);
    }

    // Map status transition to WhatsApp notification type
    if (statusChanged && newStatus) {
      let notificationType: WhatsAppMessageType | null = null;
      switch (newStatus) {
        case 'CONFIRMED':
          notificationType = 'ORDER_CONFIRMED';
          break;
        case 'ASSIGNED':
          notificationType = 'ORDER_ASSIGNED';
          break;
        case 'OUT_FOR_DELIVERY':
          notificationType = 'ORDER_OUT_FOR_DELIVERY';
          break;
        case 'DELIVERED':
          notificationType = 'ORDER_DELIVERED';
          break;
        case 'CANCELLED':
          notificationType = 'ORDER_CANCELLED';
          break;
      }

      if (notificationType) {
        whatsAppService.sendOrderNotification(orderId, notificationType).catch((err) => {
          logger.error('admin.orders.status', 'Background WhatsApp dispatch failed on status update', {
            orderId,
            newStatus,
            error: (err as Error).message,
          });
        });
      }

      logger.info('order.status', 'Order status updated', {
        orderId,
        oldStatus: currentStatus,
        newStatus,
        changedBy: session.email,
      });
    }

    if (paymentChanged) {
      logger.info('order.payment', 'Order payment status updated', {
        orderId,
        paymentStatus: body.paymentStatus,
        changedBy: session.email,
      });
    }

    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
        customer: true,
        state: true,
        city: true,
        deliveryPartner: true,
        deliveryAssignments: {
          orderBy: [desc(orderDeliveryAssignments.createdAt)],
          with: {
            deliveryPartner: true,
          },
        },
        statusHistory: {
          orderBy: [desc(orderStatusHistory.createdAt)],
        },
        whatsappMessages: {
          orderBy: [desc(whatsappMessages.createdAt)],
        },
      },
    });

    return Response.json({
      success: true,
      order: updatedOrder,
      newStatus: newStatus || currentStatus,
      paymentStatus: (updateData.paymentStatus as string) || order.paymentStatus,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return Response.json({ message: 'Failed to update order' }, { status: 500 });
  }
}


// Native Astro APIRoute exports
export const GET = wrapHandler(_GET);
export const PATCH = wrapHandler(_PATCH);
