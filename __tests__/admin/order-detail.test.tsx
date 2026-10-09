import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import AdminOrderDetailPage from '@/components/admin/admin-order-detail';
import { sharedQueryClient } from '@/components/providers';
import { queryKeys } from '@/lib/query/keys';

describe('AdminOrderDetailPage Component', () => {
  it('renders order detail with null customerMobileSnapshot and null addressSnapshot safely', () => {
    const mockOrder = {
      id: 999,
      invoiceNumber: 'FW-20261002-9999',
      orderStatus: 'CONFIRMED',
      fulfillmentType: 'DELIVERY',
      subtotal: '1200.00',
      discountAmount: '100.00',
      deliveryCharge: '50.00',
      totalAmount: '1150.00',
      customerNameSnapshot: 'Test User',
      customerMobileSnapshot: null,
      addressSnapshot: null,
      placedAt: '2026-10-02T10:00:00.000Z',
      items: [
        {
          id: 1,
          productNameSnapshot: '10cm Electric Sparklers',
          sellingPriceSnapshot: '200',
          mrpSnapshot: '300',
          quantity: 2,
          lineTotal: '400',
        },
      ],
      statusHistory: [
        {
          id: 1,
          newStatus: 'CONFIRMED',
          note: 'Confirmed by admin',
          createdAt: '2026-10-02T10:05:00.000Z',
          changedBy: 'admin',
        },
      ],
      whatsappMessages: [],
    };

    sharedQueryClient.setQueryData(queryKeys.admin.orders.detail(999), { order: mockOrder });

    const html = renderToString(<AdminOrderDetailPage params={{ id: '999' }} />);
    expect(html).toContain('FW-20261002-9999');
    expect(html).toContain('10cm Electric Sparklers');
    expect(html).toContain('WhatsApp Message (Editable):');
    expect(html).toContain('<textarea');
    expect(html).toContain('Send on WhatsApp');
  });

  it('renders fallback error card when order is not found', () => {
    sharedQueryClient.setQueryData(queryKeys.admin.orders.detail(888), null);

    const html = renderToString(<AdminOrderDetailPage params={{ id: '888' }} />);
    expect(html).toContain('Order Not Found');
    expect(html).toContain('Back to Orders');
  });

  it('enforces payment gating: shows Check & Mark as Paid and locked partner card when unpaid', () => {
    const unpaidOrder = {
      id: 1001,
      invoiceNumber: 'FW-20261002-1001',
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PENDING',
      fulfillmentType: 'DELIVERY',
      subtotal: '2000.00',
      discountAmount: '0.00',
      deliveryCharge: '100.00',
      totalAmount: '2100.00',
      customerNameSnapshot: 'Ramesh',
      customerMobileSnapshot: '9876543210',
      addressSnapshot: null,
      placedAt: '2026-10-02T10:00:00.000Z',
      items: [],
      statusHistory: [],
      whatsappMessages: [],
    };

    sharedQueryClient.setQueryData(queryKeys.admin.orders.detail(1001), { order: unpaidOrder });

    const html = renderToString(<AdminOrderDetailPage params={{ id: '1001' }} />);
    // Stepper has Review, Confirm, and Check payment
    expect(html).toContain('Review order');
    expect(html).toContain('Confirm order');
    expect(html).toContain('Check payment');
    // Gated next action button
    expect(html).toContain('Check &amp; Mark as Paid');
    // Delivery partner assignment section must NOT be shown during check payment step
    expect(html).not.toContain('delivery-partner-section');
    expect(html).not.toContain('Select Active Delivery Partner');
  });

  it('unlocks delivery assignment once payment is marked as PAID', () => {
    const paidOrder = {
      id: 1002,
      invoiceNumber: 'FW-20261002-1002',
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      fulfillmentType: 'DELIVERY',
      subtotal: '2000.00',
      discountAmount: '0.00',
      deliveryCharge: '100.00',
      totalAmount: '2100.00',
      customerNameSnapshot: 'Suresh',
      customerMobileSnapshot: '9876543211',
      addressSnapshot: null,
      placedAt: '2026-10-02T10:00:00.000Z',
      items: [],
      statusHistory: [],
      whatsappMessages: [],
    };

    sharedQueryClient.setQueryData(queryKeys.admin.orders.detail(1002), { order: paidOrder });

    const html = renderToString(<AdminOrderDetailPage params={{ id: '1002' }} />);
    // Next action unlocked to Assign Delivery Partner
    expect(html).toContain('Assign Delivery Partner');
    // Delivery partner assignment section is now visible
    expect(html).toContain('delivery-partner-section');
    expect(html).toContain('Select Active Delivery Partner');
  });
});

