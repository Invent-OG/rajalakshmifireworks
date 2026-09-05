import { db } from '@/db';
import { orders, whatsappMessages, customers } from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { whatsAppClient } from './client';
import { buildMetaTemplatePayload } from './templates';
import { normalizePhoneNumber, maskPhoneNumber } from './validation';
import { WhatsAppError, WhatsAppApiError } from './errors';
import { logger } from '@/lib/utils/logger';
import type {
  WhatsAppMessageType,
  WhatsAppOrderDetails,
  SendWhatsAppResult,
} from './types';

export class WhatsAppService {
  /**
   * Main dispatch method for order notifications.
   * Handles idempotency, phone normalization, template construction,
   * database auditing, and failure containment.
   */
  async sendOrderNotification(
    orderId: number,
    messageType: WhatsAppMessageType,
    forceRetry: boolean = false
  ): Promise<SendWhatsAppResult> {
    // 1. Fetch order and customer details
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
        customer: true,
      },
    });

    if (!order) {
      logger.error('whatsapp.service', 'Order not found for WhatsApp notification', { orderId, messageType });
      return {
        success: false,
        status: 'FAILED',
        errorCode: 'ORDER_NOT_FOUND',
        errorMessage: `Order with ID ${orderId} does not exist`,
        attemptCount: 0,
      };
    }

    // 2. Idempotency Check: Prevent duplicate sends for the same order and message type
    if (!forceRetry) {
      const existingSuccess = await db.query.whatsappMessages.findFirst({
        where: and(
          eq(whatsappMessages.orderId, orderId),
          eq(whatsappMessages.messageType, messageType),
          inArray(whatsappMessages.status, ['SENT', 'DELIVERED', 'READ'])
        ),
      });

      if (existingSuccess) {
        logger.info('whatsapp.service', 'Notification already sent (idempotent skip)', {
          orderId,
          messageType,
          providerMessageId: existingSuccess.providerMessageId,
          status: existingSuccess.status,
        });
        return {
          success: true,
          messageId: existingSuccess.id,
          providerMessageId: existingSuccess.providerMessageId || undefined,
          status: existingSuccess.status as any,
          attemptCount: existingSuccess.attemptCount,
        };
      }
    }

    // 3. Normalize recipient phone number
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhoneNumber(order.customerMobileSnapshot);
    } catch (err) {
      const errorMsg = (err as Error).message || 'Invalid customer phone number';
      logger.error('whatsapp.service', 'Phone normalization failed', {
        orderId,
        messageType,
        error: errorMsg,
      });

      // Audit failed record
      const [failedRecord] = await db
        .insert(whatsappMessages)
        .values({
          orderId: order.id,
          customerId: order.customerId,
          phoneNumber: order.customerMobileSnapshot,
          messageType,
          templateName: 'unknown',
          status: 'FAILED',
          errorCode: 'INVALID_PHONE_NUMBER',
          errorMessage: errorMsg,
          attemptCount: 1,
          lastAttemptAt: new Date(),
          failedAt: new Date(),
        })
        .returning();

      return {
        success: false,
        messageId: failedRecord.id,
        status: 'FAILED',
        classification: 'NON_RETRYABLE',
        errorCode: 'INVALID_PHONE_NUMBER',
        errorMessage: errorMsg,
        attemptCount: 1,
      };
    }

    // 4. Build template payload
    const orderDetails: WhatsAppOrderDetails = {
      id: order.id,
      invoiceNumber: order.invoiceNumber,
      customerId: order.customerId,
      customerNameSnapshot: order.customerNameSnapshot,
      customerMobileSnapshot: order.customerMobileSnapshot,
      fulfillmentType: order.fulfillmentType,
      totalAmount: order.totalAmount,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      deliveryCharge: order.deliveryCharge,
      addressSnapshot: order.addressSnapshot as any,
      items: order.items?.map((item) => ({
        productNameSnapshot: item.productNameSnapshot,
        quantity: item.quantity,
        sellingPriceSnapshot: item.sellingPriceSnapshot,
        lineTotal: item.lineTotal,
      })),
      placedAt: order.placedAt,
    };

    const { templateName, payload } = buildMetaTemplatePayload(
      normalizedPhone,
      messageType,
      orderDetails
    );

    // 5. Initialize or locate message record in database
    let messageRecord = await db.query.whatsappMessages.findFirst({
      where: and(
        eq(whatsappMessages.orderId, orderId),
        eq(whatsappMessages.messageType, messageType)
      ),
      orderBy: [desc(whatsappMessages.createdAt)],
    });

    const currentAttempts = messageRecord ? messageRecord.attemptCount + 1 : 1;

    if (!messageRecord) {
      const [newRecord] = await db
        .insert(whatsappMessages)
        .values({
          orderId: order.id,
          customerId: order.customerId,
          phoneNumber: normalizedPhone,
          messageType,
          templateName,
          status: 'PENDING',
          attemptCount: 1,
          lastAttemptAt: new Date(),
          payloadSnapshot: payload as any,
        })
        .returning();
      messageRecord = newRecord;
    } else {
      await db
        .update(whatsappMessages)
        .set({
          status: 'PENDING',
          attemptCount: currentAttempts,
          lastAttemptAt: new Date(),
          templateName,
          phoneNumber: normalizedPhone,
          payloadSnapshot: payload as any,
          updatedAt: new Date(),
        })
        .where(eq(whatsappMessages.id, messageRecord.id));
    }

    // 6. Dispatch message via Meta Client
    try {
      const result = await whatsAppClient.sendTemplateMessage(payload);

      await db
        .update(whatsappMessages)
        .set({
          status: 'SENT',
          providerMessageId: result.providerMessageId,
          sentAt: new Date(),
          errorCode: null,
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(whatsappMessages.id, messageRecord.id));

      logger.info('whatsapp.service', 'WhatsApp notification dispatched', {
        orderId,
        invoiceNumber: order.invoiceNumber,
        messageType,
        providerMessageId: result.providerMessageId,
        recipient: maskPhoneNumber(normalizedPhone),
      });

      return {
        success: true,
        messageId: messageRecord.id,
        providerMessageId: result.providerMessageId,
        status: 'SENT',
        attemptCount: currentAttempts,
      };
    } catch (error) {
      const err = error as WhatsAppError;
      const errorCode = err.code ? String(err.code) : 'UNKNOWN_ERROR';
      const errorMessage = err.message || 'WhatsApp dispatch failed';
      const classification = err.classification || 'NON_RETRYABLE';

      await db
        .update(whatsappMessages)
        .set({
          status: 'FAILED',
          errorCode,
          errorMessage,
          failedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(whatsappMessages.id, messageRecord.id));

      logger.error('whatsapp.service', 'WhatsApp notification delivery failed', {
        orderId,
        invoiceNumber: order.invoiceNumber,
        messageType,
        errorCode,
        errorMessage,
        classification,
        recipient: maskPhoneNumber(normalizedPhone),
      });

      return {
        success: false,
        messageId: messageRecord.id,
        status: 'FAILED',
        classification,
        errorCode,
        errorMessage,
        attemptCount: currentAttempts,
      };
    }
  }

  // --- Specialized Lifecycle Handlers ---

  async sendOrderReceived(orderId: number): Promise<SendWhatsAppResult> {
    return this.sendOrderNotification(orderId, 'ORDER_RECEIVED');
  }

  async sendOrderConfirmed(orderId: number): Promise<SendWhatsAppResult> {
    return this.sendOrderNotification(orderId, 'ORDER_CONFIRMED');
  }

  async sendOrderPacked(orderId: number): Promise<SendWhatsAppResult> {
    return this.sendOrderNotification(orderId, 'ORDER_PACKED');
  }

  async sendOrderOutForDelivery(orderId: number): Promise<SendWhatsAppResult> {
    return this.sendOrderNotification(orderId, 'ORDER_OUT_FOR_DELIVERY');
  }

  async sendOrderDelivered(orderId: number): Promise<SendWhatsAppResult> {
    return this.sendOrderNotification(orderId, 'ORDER_DELIVERED');
  }

  async sendOrderCancelled(orderId: number): Promise<SendWhatsAppResult> {
    return this.sendOrderNotification(orderId, 'ORDER_CANCELLED');
  }

  /**
   * Manual admin retry for a specific message record.
   */
  async retryNotification(
    messageId: number,
    adminEmail: string
  ): Promise<SendWhatsAppResult> {
    const record = await db.query.whatsappMessages.findFirst({
      where: eq(whatsappMessages.id, messageId),
    });

    if (!record) {
      return {
        success: false,
        status: 'FAILED',
        errorCode: 'MESSAGE_NOT_FOUND',
        errorMessage: `Notification with ID ${messageId} not found`,
        attemptCount: 0,
      };
    }

    logger.info('whatsapp.service', 'Admin initiated manual WhatsApp retry', {
      messageId,
      orderId: record.orderId,
      messageType: record.messageType,
      adminEmail,
    });

    return this.sendOrderNotification(
      record.orderId,
      record.messageType as WhatsAppMessageType,
      true // forceRetry = true bypasses duplicate check
    );
  }

  /**
   * Fetch all WhatsApp notification history for an order.
   */
  async getNotificationHistory(orderId: number) {
    return db.query.whatsappMessages.findMany({
      where: eq(whatsappMessages.orderId, orderId),
      orderBy: [desc(whatsappMessages.createdAt)],
    });
  }
}

export const whatsAppService = new WhatsAppService();
