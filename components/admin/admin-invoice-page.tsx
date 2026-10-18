'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Printer, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';
import { InvoiceCustomizer, printInvoiceSheet } from './invoice-customizer';
import { withAdminShell } from './admin-shell';

const DEMO_TEMPLATE_ORDER = {
  id: 0,
  invoiceNumber: '00001',
  customerNameSnapshot: 'Customer Name',
  customerCompany: '',
  customerMobileSnapshot: '',
  orderStatus: 'CONFIRMED',
  fulfillmentType: 'DELIVERY',
  placedAt: new Date().toISOString(),
  addressSnapshot: {
    deliveryAddress: 'Customer Delivery Address',
    deliveryCityName: 'Sivakasi',
    deliveryStateName: 'Tamil Nadu',
    pincode: '626123',
  },
  subtotal: '2500.00',
  discountAmount: '0.00',
  deliveryCharge: '0.00',
  totalAmount: '2500.00',
  finalAmount: '2500.00',
  items: [
    {
      id: 1,
      productNameSnapshot: '10cm Electric Sparklers (1 Box)',
      quantity: 2,
      sellingPriceSnapshot: '150.00',
      lineTotal: '300.00',
    },
    {
      id: 2,
      productNameSnapshot: 'Ground Chakkar Special (1 Box)',
      quantity: 5,
      sellingPriceSnapshot: '240.00',
      lineTotal: '1200.00',
    },
    {
      id: 3,
      productNameSnapshot: 'Flower Pots Giant (1 Box)',
      quantity: 2,
      sellingPriceSnapshot: '500.00',
      lineTotal: '1000.00',
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
    return '';
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
  const { data: ordersData, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['admin', 'orders', 'list', { limit: 15 }],
    queryFn: () => fetch('/api/admin/orders?limit=15').then((r) => r.json()),
  });

  // If a specific order is requested by orderId in the URL, fetch it directly
  const { data: specificOrderData, isLoading: isLoadingSpecific } = useQuery({
    queryKey: ['admin', 'orders', selectedOrderId],
    queryFn: () => fetch(`/api/admin/orders/${selectedOrderId}`).then((r) => r.json()),
    enabled: Boolean(selectedOrderId && selectedOrderId !== 'demo'),
  });

  // Fetch store settings for initial defaults
  const { data: settingsData } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => fetch('/api/admin/settings').then((r) => r.json()),
  });

  const recentOrders = ordersData?.orders || [];
  const settingsMap = settingsData?.settings || {};

  // Auto-select latest real order if none was specified in URL
  useEffect(() => {
    if (!selectedOrderId && recentOrders.length > 0) {
      setSelectedOrderId(String(recentOrders[0].id));
    }
  }, [selectedOrderId, recentOrders]);

  const specificOrder = specificOrderData?.order;
  const orderFromRecent = recentOrders.find(
    (o: any) => String(o.id) === selectedOrderId || o.invoiceNumber === selectedOrderId
  );

  const isWaitingForSpecificOrder = Boolean(
    selectedOrderId &&
    selectedOrderId !== 'demo' &&
    isLoadingSpecific &&
    !specificOrder &&
    !orderFromRecent
  );

  const currentOrder =
    specificOrder ||
    orderFromRecent ||
    (selectedOrderId === 'demo' ? DEMO_TEMPLATE_ORDER : recentOrders[0] || DEMO_TEMPLATE_ORDER);

  // Auto-trigger print if ?print=true was passed in URL and real order has finished loading
  useEffect(() => {
    if (
      shouldAutoPrint &&
      !printedRef.current &&
      !isWaitingForSpecificOrder &&
      currentOrder &&
      currentOrder.id !== 0
    ) {
      printedRef.current = true;
      const timer = setTimeout(() => {
        printInvoiceSheet(
          currentOrder.invoiceNumber ? `Invoice #${currentOrder.invoiceNumber}` : 'Invoice',
          currentOrder.invoiceNumber
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoPrint, isWaitingForSpecificOrder, currentOrder]);

  if (isWaitingForSpecificOrder) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading order details...</p>
      </div>
    );
  }

  const isNotFound = Boolean(
    selectedOrderId &&
    selectedOrderId !== 'demo' &&
    !isLoadingSpecific &&
    !specificOrder &&
    !orderFromRecent
  );

  if (isNotFound) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
        <p className="text-lg font-bold text-foreground">Order #{selectedOrderId} Not Found</p>
        <p className="text-xs text-muted-foreground">The requested order could not be located in the database.</p>
        <a
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
        </a>
      </div>
    );
  }

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
                {currentOrder?.invoiceNumber && currentOrder.id !== 0 && (
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
            value={selectedOrderId || (currentOrder ? String(currentOrder.id) : 'demo')}
            onChange={(e) => {
              setSelectedOrderId(e.target.value);
              const url = new URL(window.location.href);
              if (e.target.value === 'demo' || !e.target.value) {
                url.searchParams.delete('orderId');
                url.searchParams.delete('print');
              } else {
                url.searchParams.set('orderId', e.target.value);
              }
              window.history.replaceState({}, '', url.toString());
            }}
            className="h-10 px-4 rounded-full border border-border bg-card text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900/20 cursor-pointer shadow-2xs"
          >
            {specificOrder && !recentOrders.some((o: any) => String(o.id) === String(specificOrder.id)) && (
              <option value={String(specificOrder.id)}>
                Order #{specificOrder.invoiceNumber} — {specificOrder.customerNameSnapshot || 'Customer'}
              </option>
            )}
            {recentOrders.map((o: any) => (
              <option key={o.id} value={String(o.id)}>
                Order #{o.invoiceNumber} — {o.customerNameSnapshot || 'Customer'}
              </option>
            ))}
            <option value="demo">Sample Template Preview</option>
          </select>
        </div>
      </div>

      {/* Embedded Live Invoice Customizer */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs print:border-none print:shadow-none print:rounded-none print:bg-transparent print:p-0 print:overflow-visible">
        <InvoiceCustomizer
          key={currentOrder ? `${currentOrder.id}-${currentOrder.invoiceNumber}` : 'empty'}
          order={currentOrder}
          initialSettings={settingsMap}
          isModal={false}
        />
      </div>
    </div>
  );
}

export default withAdminShell(AdminInvoicePageContent);
