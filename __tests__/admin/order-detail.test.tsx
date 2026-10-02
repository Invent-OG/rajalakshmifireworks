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
  });

  it('renders fallback error card when order is not found', () => {
    sharedQueryClient.setQueryData(queryKeys.admin.orders.detail(888), null);

    const html = renderToString(<AdminOrderDetailPage params={{ id: '888' }} />);
    expect(html).toContain('Order Not Found');
    expect(html).toContain('Back to Orders');
  });
});
