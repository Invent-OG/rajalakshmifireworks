import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  getNextStatuses,
  canCancel,
  isTerminalStatus,
  validateTransition,
  getStatusTimestampField,
} from '@/lib/services/order-status-machine';
import { buildMetaTemplatePayload } from '@/lib/whatsapp/templates';
import type { WhatsAppOrderDetails } from '@/lib/whatsapp/types';

describe('Client Order Lifecycle Workflow Validation', () => {
  describe('1. Delivery Workflow (Steps 1 to 14)', () => {
    it('allows complete step-by-step sequential delivery transition flow', () => {
      // Step 1 -> 4: Customer places order (NEW) -> Admin accepts order (CONFIRMED)
      expect(validateTransition('NEW', 'CONFIRMED', 'DELIVERY')).toBeNull();

      // Step 4 -> 7: Admin starts processing -> marks as packed
      expect(validateTransition('CONFIRMED', 'PROCESSING', 'DELIVERY')).toBeNull();
      expect(validateTransition('PROCESSING', 'PACKED', 'DELIVERY')).toBeNull();

      // Direct pack from CONFIRMED is also supported
      expect(validateTransition('CONFIRMED', 'PACKED', 'DELIVERY')).toBeNull();

      // Step 7 -> 9: Admin assigns delivery partner -> dispatches order
      expect(validateTransition('PACKED', 'ASSIGNED', 'DELIVERY')).toBeNull();
      expect(validateTransition('ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERY')).toBeNull();

      // Step 9 -> 11: Dispatch -> Delivered
      expect(validateTransition('OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY')).toBeNull();

      // Step 11 -> 14: Delivered -> Completed
      expect(validateTransition('DELIVERED', 'COMPLETED', 'DELIVERY')).toBeNull();
    });

    it('blocks pickup-specific statuses on delivery orders', () => {
      expect(validateTransition('PACKED', 'READY_FOR_PICKUP', 'DELIVERY')).toContain('Cannot set pickup status');
      expect(validateTransition('PACKED', 'PICKED_UP', 'DELIVERY')).toContain('Cannot set pickup status');
    });
  });

  describe('2. Shop Pickup Workflow', () => {
    it('allows complete step-by-step pickup transition flow', () => {
      // Step 1 -> 2: Placed (NEW) -> Confirmed
      expect(validateTransition('NEW', 'CONFIRMED', 'PICKUP')).toBeNull();

      // Step 2 -> 4: Confirmed -> Processing -> Packed
      expect(validateTransition('CONFIRMED', 'PROCESSING', 'PICKUP')).toBeNull();
      expect(validateTransition('PROCESSING', 'PACKED', 'PICKUP')).toBeNull();

      // Step 4 -> 5: Packed -> Ready for Pickup
      expect(validateTransition('PACKED', 'READY_FOR_PICKUP', 'PICKUP')).toBeNull();

      // Step 5 -> 7: Ready for Pickup -> Picked Up (or Delivered legacy)
      expect(validateTransition('READY_FOR_PICKUP', 'PICKED_UP', 'PICKUP')).toBeNull();
      expect(validateTransition('READY_FOR_PICKUP', 'DELIVERED', 'PICKUP')).toBeNull();

      // Step 7 -> 8: Picked Up -> Completed
      expect(validateTransition('PICKED_UP', 'COMPLETED', 'PICKUP')).toBeNull();
      expect(validateTransition('DELIVERED', 'COMPLETED', 'PICKUP')).toBeNull();
    });

    it('blocks delivery partner assignment and out-for-delivery on pickup orders', () => {
      expect(validateTransition('PACKED', 'ASSIGNED', 'PICKUP')).toContain('Cannot assign delivery');
      expect(validateTransition('PACKED', 'OUT_FOR_DELIVERY', 'PICKUP')).toContain('Cannot assign delivery');
    });
  });

  describe('3. Cancellation & Terminal Safety', () => {
    it('allows cancellation only for active stages', () => {
      expect(canCancel('NEW')).toBe(true);
      expect(canCancel('CONFIRMED')).toBe(true);
      expect(canCancel('PROCESSING')).toBe(true);
      expect(canCancel('PACKED')).toBe(true);
      expect(canCancel('ASSIGNED')).toBe(true);
      expect(canCancel('READY_FOR_PICKUP')).toBe(true);

      // Terminal or completed orders cannot be cancelled
      expect(canCancel('DELIVERED')).toBe(false);
      expect(canCancel('COMPLETED')).toBe(false);
      expect(canCancel('CANCELLED')).toBe(false);
    });

    it('treats COMPLETED and CANCELLED as terminal', () => {
      expect(isTerminalStatus('COMPLETED')).toBe(true);
      expect(isTerminalStatus('CANCELLED')).toBe(true);
      expect(isTerminalStatus('DELIVERED')).toBe(false);
    });
  });

  describe('4. Lifecycle Timestamp Audit Mapping', () => {
    it('maps all workflow states to accurate timestamp columns', () => {
      expect(getStatusTimestampField('CONFIRMED')).toBe('confirmedAt');
      expect(getStatusTimestampField('PACKED')).toBe('packedAt');
      expect(getStatusTimestampField('ASSIGNED')).toBe('assignedAt');
      expect(getStatusTimestampField('OUT_FOR_DELIVERY')).toBe('dispatchedAt');
      expect(getStatusTimestampField('READY_FOR_PICKUP')).toBe('readyForPickupAt');
      expect(getStatusTimestampField('PICKED_UP')).toBe('pickedUpAt');
      expect(getStatusTimestampField('DELIVERED')).toBe('deliveredAt');
      expect(getStatusTimestampField('COMPLETED')).toBe('completedAt');
      expect(getStatusTimestampField('CANCELLED')).toBe('cancelledAt');
    });
  });

  describe('5. WhatsApp Template Construction for All Workflow Events', () => {
    const mockOrder: WhatsAppOrderDetails = {
      id: 501,
      invoiceNumber: 'FW-20261013-0001',
      customerId: 10,
      customerNameSnapshot: 'Ramesh Kumar',
      customerMobileSnapshot: '9876543210',
      fulfillmentType: 'DELIVERY',
      subtotal: '2500.00',
      discountAmount: '0.00',
      deliveryCharge: '50.00',
      totalAmount: '2550.00',
      placedAt: new Date(),
      items: [
        {
          productNameSnapshot: '10cm Electric Sparklers',
          quantity: 2,
          sellingPriceSnapshot: '200.00',
          lineTotal: '400.00',
        },
      ],
      addressSnapshot: {
        address: '12 Gandhi Road',
        city: 'Madurai',
        pincode: '625001',
      },
    };

    it('builds valid WhatsApp payloads for each required workflow notification', () => {
      const types = [
        'ORDER_RECEIVED',
        'ORDER_CONFIRMED',
        'PAYMENT_VERIFIED',
        'ORDER_PACKED',
        'ORDER_ASSIGNED',
        'ORDER_OUT_FOR_DELIVERY',
        'ORDER_READY_FOR_PICKUP',
        'ORDER_PICKED_UP',
        'ORDER_DELIVERED',
        'ORDER_COMPLETED',
        'ORDER_CANCELLED',
      ] as const;

      for (const msgType of types) {
        const { templateName, payload } = buildMetaTemplatePayload('919876543210', msgType, mockOrder);
        expect(templateName).toBeDefined();
        expect(payload.messaging_product).toBe('whatsapp');
        expect(payload.to).toBe('919876543210');
        expect(payload.template.components.length).toBeGreaterThan(0);
      }
    });
  });

  describe('6. Consignment Package Count (Cases / Boxes) Workflow', () => {
    it('supports custom case/box quantities for Sivakasi lorry transport', () => {
      const packedOrderWithBoxes: WhatsAppOrderDetails = {
        id: 502,
        invoiceNumber: 'FW-20261013-0002',
        customerId: 11,
        customerNameSnapshot: 'Murugan Fireworks Depot',
        customerMobileSnapshot: '9842199999',
        fulfillmentType: 'DELIVERY',
        subtotal: '12000.00',
        discountAmount: '0.00',
        deliveryCharge: '200.00',
        totalAmount: '12200.00',
        packageCount: 4,
        carriageDetails: 'ARC Parcel Service - Sivakasi Godown',
        lrNumber: 'ARC-789123',
      };

      expect(packedOrderWithBoxes.packageCount).toBe(4);
      expect(packedOrderWithBoxes.carriageDetails).toBe('ARC Parcel Service - Sivakasi Godown');
      expect(packedOrderWithBoxes.lrNumber).toBe('ARC-789123');

      // Verify template creation works with custom package count
      const { templateName, payload } = buildMetaTemplatePayload(
        '919842199999',
        'ORDER_PACKED',
        packedOrderWithBoxes
      );
      expect(templateName).toBeDefined();
      expect(payload.template.components.length).toBeGreaterThan(0);
    });
  });
});
