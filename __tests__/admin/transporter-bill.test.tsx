import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TransporterBillView, type TransporterBillData } from '@/components/admin/transporter-bill';

describe('TransporterBillView Component', () => {
  const mockBillData: TransporterBillData = {
    orderId: 777,
    invoiceNumber: 'FW-20261013-0077',
    customerName: 'Suresh Kumar',
    customerMobile: '9842155555',
    customerEmail: 'suresh@example.com',
    shippingAddress: {
      address: '14/2 Gandhi Market Road, Near Old Bus Stand',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641001',
    },
    customerNotes: 'Landmark - Opp Reliance Super',
    packageCount: 3,
    totalAmount: 14500,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI',
    placedAt: '2026-10-13T10:30:00.000Z',
    carrierName: 'KRS Parcel Service - Coimbatore Depot',
    driverMobile: '9443199887',
    vehicleType: 'Eicher Van',
    vehicleNumber: 'TN 67 AB 1234',
    lrNumber: 'KRS-908123',
    itemsCount: 5,
  };

  const mockSettings = {
    INVOICE_STORE_NAME: 'Rajalakshmi Fireworks Sivakasi',
    INVOICE_STORE_ADDRESS: '123 Factory Road, Sivakasi, Tamil Nadu - 626123',
    INVOICE_STORE_PHONE: '+91 98421 00001',
    INVOICE_GSTIN: '33CKMPR3170C1Z9',
    INVOICE_LICENSE_NO: 'E/SC/TN/2024/00142 (Green Crackers)',
  };

  it('renders all required company, customer, bill, and transport fields', () => {
    const html = renderToString(
      <TransporterBillView
        data={mockBillData}
        storeSettings={mockSettings}
        isModal={false}
      />
    );

    // 1. Company details
    expect(html).toContain('Rajalakshmi Fireworks Sivakasi');
    expect(html).toContain('123 Factory Road, Sivakasi');
    expect(html).toContain('+91 98421 00001');
    expect(html).toContain('33CKMPR3170C1Z9');
    expect(html).toContain('E/SC/TN/2024/00142');

    // 2. Customer details
    expect(html).toContain('Suresh Kumar');

    // 3. Bill no
    expect(html).toContain('FW-20261013-0077');

    // 4. No of box (Cases / Boxes)
    expect(html).toContain('NO. OF BOXES / CASES:');
    expect(html).toContain('CASES / BOXES');
    expect(html).toContain('3');

    // 5. Shipping address
    expect(html).toContain('14/2 Gandhi Market Road, Near Old Bus Stand');
    expect(html).toContain('Coimbatore');
    expect(html).toContain('641001');
    expect(html).toContain('Landmark - Opp Reliance Super');

    // 6. Phone number
    expect(html).toContain('+91');
    expect(html).toContain('9842155555');

    // 7. Transporter / Delivery partner details
    expect(html).toContain('KRS Parcel Service - Coimbatore Depot');
    expect(html).toContain('9443199887');
    expect(html).not.toContain('TN 67 AB 1234');
    expect(html).not.toContain('KRS-908123');
    expect(html).not.toContain('Payment Mode');
  });

  it('renders standalone bill sheet with print controls', () => {
    const html = renderToString(
      <TransporterBillView
        data={mockBillData}
        storeSettings={mockSettings}
        isModal={false}
      />
    );

    expect(html).toContain('Transporter Bill / Dispatch Note');
    expect(html).toContain('Print Transporter Bill');
    expect(html).toContain('Copy Summary');
    expect(html).toContain('transporter-bill-sheet');
  });
});
