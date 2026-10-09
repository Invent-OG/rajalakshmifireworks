'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Printer, Sparkles, RefreshCw } from 'lucide-react';
import { InvoiceCustomizer } from './invoice-customizer';
import { withAdminShell } from './admin-shell';

const DEMO_TEMPLATE_ORDER = {
  id: 0,
  invoiceNumber: '01234',
  customerNameSnapshot: 'Helene Paquet',
  customerCompany: 'Thynk Unlimited',
  customerMobileSnapshot: '9842100001',
  orderStatus: 'CONFIRMED',
  placedAt: new Date().toISOString(),
  addressSnapshot: {
    address: '123 Anywhere St., Sivakasi Depot',
    city: 'Sivakasi',
    pincode: '626123',
  },
  subtotal: '900.00',
  discountAmount: '0.00',
  deliveryCharge: '0.00',
  totalAmount: '990.00',
  finalAmount: '990.00',
  items: [
    {
      id: 1,
      productNameSnapshot: 'Social Media Strategy Plan',
      quantity: 1,
      sellingPriceSnapshot: '100.00',
      lineTotal: '100.00',
    },
    {
      id: 2,
      productNameSnapshot: 'Content Creation (5 posts)',
      quantity: 5,
      sellingPriceSnapshot: '100.00',
      lineTotal: '500.00',
    },
    {
      id: 3,
      productNameSnapshot: 'Scheduling & Reporting',
      quantity: 1,
      sellingPriceSnapshot: '100.00',
      lineTotal: '100.00',
    },
    {
      id: 4,
      productNameSnapshot: 'Instagram Story Design (3 slides)',
      quantity: 3,
      sellingPriceSnapshot: '50.00',
      lineTotal: '150.00',
    },
    {
      id: 5,
      productNameSnapshot: 'Hashtag Research',
      quantity: 1,
      sellingPriceSnapshot: '50.00',
      lineTotal: '50.00',
    },
  ],
};

function AdminInvoicePageContent() {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('demo');

  // Fetch recent orders so admin can preview live orders in the customizer
  const { data: ordersData } = useQuery({
    queryKey: ['admin', 'orders', 'list', { limit: 15 }],
    queryFn: () => fetch('/api/admin/orders?limit=15').then((r) => r.json()),
  });

  // Fetch store settings for initial defaults
  const { data: settingsData } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => fetch('/api/admin/settings').then((r) => r.json()),
  });

  const recentOrders = ordersData?.orders || [];
  const settingsMap = settingsData?.settings || {};

  const currentOrder =
    selectedOrderId === 'demo'
      ? DEMO_TEMPLATE_ORDER
      : recentOrders.find((o: any) => String(o.id) === selectedOrderId) || DEMO_TEMPLATE_ORDER;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Title & Order Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Invoice & Dispatch Slip Template Editor
              </h1>
              <p className="text-xs text-muted-foreground">
                Customize typography, logo, signature, bank credentials, and terms inside the admin panel.
              </p>
            </div>
          </div>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            Preview with Order:
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="h-10 px-4 rounded-full border border-border bg-card text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900/20 cursor-pointer shadow-2xs"
          >
            <option value="demo">Demo Template Order (#01234)</option>
            {recentOrders.map((o: any) => (
              <option key={o.id} value={String(o.id)}>
                Order #{o.invoiceNumber} — {o.customerNameSnapshot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Embedded Live Invoice Customizer */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <InvoiceCustomizer
          order={currentOrder}
          initialSettings={settingsMap}
          isModal={false}
        />
      </div>
    </div>
  );
}

export default withAdminShell(AdminInvoicePageContent);
