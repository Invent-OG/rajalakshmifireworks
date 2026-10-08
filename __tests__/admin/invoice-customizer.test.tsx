import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { InvoiceCustomizer } from '@/components/admin/invoice-customizer';

describe('InvoiceCustomizer Component', () => {
  const mockOrder = {
    id: 101,
    invoiceNumber: 'FW-20261008-0101',
    orderStatus: 'CONFIRMED',
    fulfillmentType: 'DELIVERY',
    subtotal: '2400.00',
    discountAmount: '200.00',
    deliveryCharge: '50.00',
    totalAmount: '2250.00',
    finalAmount: '2250.00',
    customerNameSnapshot: 'Rajesh Kumar',
    customerMobileSnapshot: '9842199999',
    placedAt: '2026-10-08T10:00:00.000Z',
    addressSnapshot: {
      address: '42 South Car Street',
      city: 'Madurai',
      pincode: '625001',
    },
    paymentStatus: 'PAID',
    items: [
      {
        id: 1,
        productNameSnapshot: 'Mega 5000 Wala Festive Garland',
        quantity: 2,
        sellingPriceSnapshot: '1100.00',
        mrpSnapshot: '1500.00',
        lineTotal: '2200.00',
      },
    ],
  };

  it('renders the customizable invoice matching Image 2 layout with logo and signature upload controls', () => {
    const html = renderToString(<InvoiceCustomizer order={mockOrder} />);
    expect(html).toContain('FW-20261008-0101');
    expect(html).toContain('Rajesh Kumar');
    expect(html).toContain('Mega 5000 Wala Festive Garland');
    expect(html).toContain('INVOICE');
    expect(html).toContain('ISSUED TO:');
    expect(html).toContain('DESCRIPTION');
    expect(html).toContain('RATE');
    expect(html).toContain('TOTAL');
    expect(html).toContain('PAYMENT INFO:');
    expect(html).toContain('TERMS &amp; CONDITIONS:');
    expect(html).toContain('Upload Logo');
    expect(html).toContain('Upload Signature');
    expect(html).toContain('Print / Save PDF');
  });

  it('renders custom bank details and terms from initialSettings', () => {
    const customSettings = {
      INVOICE_DEFAULT_TITLE: 'OFFICIAL TAX INVOICE',
      INVOICE_GSTIN: '33TESTGSTIN1234Z9',
      INVOICE_BANK_NAME: 'HDFC Bank Sivakasi',
      INVOICE_ACCOUNT_NAME: 'Rajalakshmi Fireworks Custom Account',
      INVOICE_UPI_ID: 'customupi@hdfc',
      INVOICE_TERMS: 'Custom terms testing warranty and dispatch',
    };

    const html = renderToString(<InvoiceCustomizer order={mockOrder} initialSettings={customSettings} />);
    expect(html).toContain('OFFICIAL TAX INVOICE');
    expect(html).toContain('33TESTGSTIN1234Z9');
    expect(html).toContain('HDFC Bank Sivakasi');
    expect(html).toContain('Rajalakshmi Fireworks Custom Account');
    expect(html).toContain('customupi@hdfc');
    expect(html).toContain('Custom terms testing warranty and dispatch');
  });
});
