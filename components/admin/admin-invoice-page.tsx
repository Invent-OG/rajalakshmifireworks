'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Printer, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';
import { InvoiceCustomizer, printInvoiceSheet } from './invoice-customizer';
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
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('orderId');
      if (id) return id;
    }
    return 'demo';
  });

  const [shouldAutoPrint, setShouldAutoPrint] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('print') === 'true';
    }
    return false;
  });

  const printedRef = useRef(false);

  // Fetch recent orders so admin can preview live orders in the customizer
  const { data: ordersData } = useQuery({
    queryKey: ['admin', 'orders', 'list', { limit: 15 }],
    queryFn: () => fetch('/api/admin/orders?limit=15').then((r) => r.json()),
  });

  // If a specific order is requested by orderId in the URL, fetch it directly
  const { data: specificOrderData, isLoading: isLoadingSpecific } = useQuery({
    queryKey: ['admin', 'orders', selectedOrderId],
    queryFn: () => fetch(`/api/admin/orders/${selectedOrderId}`).then((r) => r.json()),
    enabled: selectedOrderId !== 'demo' && !isNaN(parseInt(selectedOrderId, 10)),
  });

  // Fetch store settings for initial defaults
  const { data: settingsData } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => fetch('/api/admin/settings').then((r) => r.json()),
  });

  const recentOrders = ordersData?.orders || [];
  const settingsMap = settingsData?.settings || {};

  const specificOrder = specificOrderData?.order;
  const currentOrder =
    selectedOrderId === 'demo'
      ? DEMO_TEMPLATE_ORDER
      : specificOrder ||
        recentOrders.find((o: any) => String(o.id) === selectedOrderId) ||
        DEMO_TEMPLATE_ORDER;

  // Auto-trigger print if ?print=true was passed in URL and order has finished loading
  useEffect(() => {
    if (shouldAutoPrint && !printedRef.current && (!isLoadingSpecific || selectedOrderId === 'demo')) {
      printedRef.current = true;
      const timer = setTimeout(() => {
        printInvoiceSheet(currentOrder.invoiceNumber ? `Invoice #${currentOrder.invoiceNumber}` : 'Invoice', currentOrder.invoiceNumber);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoPrint, isLoadingSpecific, selectedOrderId, currentOrder]);

  return (
    <div className="space-y-6 animate-fade-in pb-16 print:space-y-0 print:pb-0">
      {/* Title & Order Selector Bar */}
      <div className="invoice-no-print print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Orders</span>
            </a>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>Invoice & Dispatch Slip Editor</span>
                {selectedOrderId !== 'demo' && currentOrder?.invoiceNumber && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold">
                    #{currentOrder.invoiceNumber}
                  </span>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                Dedicated full-screen editor. Customize typography, logos, signature, and print cleanly.
              </p>
            </div>
          </div>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            Selected Order:
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => {
              setSelectedOrderId(e.target.value);
              // Update URL without full page reload
              const url = new URL(window.location.href);
              if (e.target.value === 'demo') {
                url.searchParams.delete('orderId');
                url.searchParams.delete('print');
              } else {
                url.searchParams.set('orderId', e.target.value);
              }
              window.history.replaceState({}, '', url.toString());
            }}
            className="h-10 px-4 rounded-full border border-border bg-card text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900/20 cursor-pointer shadow-2xs"
          >
            <option value="demo">Demo Template Order (#01234)</option>
            {specificOrder && !recentOrders.some((o: any) => String(o.id) === String(specificOrder.id)) && (
              <option value={String(specificOrder.id)}>
                Order #{specificOrder.invoiceNumber} — {specificOrder.customerNameSnapshot || 'Customer'}
              </option>
            )}
            {recentOrders.map((o: any) => (
              <option key={o.id} value={String(o.id)}>
                Order #{o.invoiceNumber} — {o.customerNameSnapshot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Embedded Live Invoice Customizer */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs print:border-none print:shadow-none print:rounded-none print:bg-transparent print:p-0 print:overflow-visible">
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
