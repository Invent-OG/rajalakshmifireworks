import { describe, it, expect } from 'vitest';
import {
  buildMetaTemplatePayload,
  buildTemplateComponents,
  WHATSAPP_TEMPLATES,
} from '@/lib/whatsapp/templates';
import type { WhatsAppOrderDetails } from '@/lib/whatsapp/types';

describe('WhatsApp Templates Builder', () => {
  const mockOrder: WhatsAppOrderDetails = {
    id: 42,
    invoiceNumber: 'FW-20260903-1001',
    customerId: 10,
    customerNameSnapshot: 'Murugan Raja',
    customerMobileSnapshot: '9876543210',
    fulfillmentType: 'DELIVERY',
    totalAmount: '2450.00',
    subtotal: '2400.00',
    discountAmount: '0.00',
    deliveryCharge: '50.00',
    addressSnapshot: {
      address: '10 Gandhi Road',
      city: 'Madurai',
      pincode: '625001',
    },
  };

  it('builds ORDER_RECEIVED template payload correctly', () => {
    const { templateName, payload } = buildMetaTemplatePayload(
      '919876543210',
      'ORDER_RECEIVED',
      mockOrder
    );

    expect(templateName).toBe(WHATSAPP_TEMPLATES.ORDER_RECEIVED);
    expect(payload.to).toBe('919876543210');
    expect(payload.template.name).toBe('order_received');
    expect(payload.template.language.code).toBe('en');

    const bodyComponent = payload.template.components.find((c) => c.type === 'body');
    expect(bodyComponent).toBeDefined();
    expect(bodyComponent?.parameters[0].text).toBe('Murugan Raja');
    expect(bodyComponent?.parameters[1].text).toBe('FW-20260903-1001');
    expect(bodyComponent?.parameters[2].text).toContain('2,450');
    expect(bodyComponent?.parameters[3].text).toContain('Doorstep Delivery (Madurai - 625001)');
  });

  it('builds ORDER_CONFIRMED template payload correctly for store pickup', () => {
    const pickupOrder: WhatsAppOrderDetails = {
      ...mockOrder,
      fulfillmentType: 'PICKUP',
      addressSnapshot: null,
    };

    const { payload } = buildMetaTemplatePayload(
      '919876543210',
      'ORDER_CONFIRMED',
      pickupOrder
    );

    const bodyComponent = payload.template.components.find((c) => c.type === 'body');
    expect(bodyComponent?.parameters[3].text).toBe('Store Counter Pickup (Sivakasi)');
  });

  it('builds ORDER_PACKED template parameters', () => {
    const components = buildTemplateComponents('ORDER_PACKED', mockOrder);
    expect(components[0].parameters.length).toBe(3);
    expect(components[0].parameters[0].text).toBe('Murugan Raja');
    expect(components[0].parameters[1].text).toBe('FW-20260903-1001');
  });

  it('builds ORDER_CONFIRMED template with products and quotation when items are provided', () => {
    const orderWithProducts: WhatsAppOrderDetails = {
      ...mockOrder,
      items: [
        {
          productNameSnapshot: '10cm Electric Sparklers',
          quantity: 2,
          sellingPriceSnapshot: '150.00',
          lineTotal: '300.00',
        },
        {
          productNameSnapshot: 'Flower Pots Deluxe',
          quantity: 1,
          sellingPriceSnapshot: '400.00',
          lineTotal: '400.00',
        },
      ],
    };

    const components = buildTemplateComponents('ORDER_CONFIRMED', orderWithProducts);
    expect(components[0].parameters[0].text).toBe('Murugan Raja');
    expect(components[0].parameters[1].text).toBe('FW-20260903-1001');
    // Parameter 2 includes quotation breakdown
    expect(components[0].parameters[2].text).toContain('Subtotal:');
    // Parameter 3 includes products summary
    expect(components[0].parameters[3].text).toContain('10cm Electric Sparklers (x2)');
    expect(components[0].parameters[3].text).toContain('Flower Pots Deluxe (x1)');
  });

  it('builds ORDER_ASSIGNED template with assigned delivery partner and products', () => {
    const assignedOrder: WhatsAppOrderDetails = {
      ...mockOrder,
      deliveryPartner: {
        name: 'Ramesh Kumar',
        mobileNumber: '9842100000',
        vehicleType: 'Tata Ace',
        vehicleNumber: 'TN 67 AB 1234',
      },
      items: [
        {
          productNameSnapshot: 'Ground Chakkar Big',
          quantity: 5,
          sellingPriceSnapshot: '80.00',
          lineTotal: '400.00',
        },
      ],
    };

    const components = buildTemplateComponents('ORDER_ASSIGNED', assignedOrder);
    expect(components[0].parameters[0].text).toBe('Murugan Raja');
    expect(components[0].parameters[1].text).toBe('FW-20260903-1001');
    expect(components[0].parameters[2].text).toContain('Ramesh Kumar (9842100000)');
    expect(components[0].parameters[2].text).toContain('TN 67 AB 1234');
    expect(components[0].parameters[3].text).toContain('Ground Chakkar Big (x5)');
    expect(components[0].parameters[3].text).toContain('2,450');
  });

  it('builds ORDER_OUT_FOR_DELIVERY with full delivery address and products', () => {
    const orderWithProducts: WhatsAppOrderDetails = {
      ...mockOrder,
      items: [
        {
          productNameSnapshot: '28 Chorsa Crackers',
          quantity: 3,
          sellingPriceSnapshot: '50.00',
          lineTotal: '150.00',
        },
      ],
    };
    const components = buildTemplateComponents('ORDER_OUT_FOR_DELIVERY', orderWithProducts);
    expect(components[0].parameters[2].text).toContain('10 Gandhi Road, Madurai - 625001');
    expect(components[0].parameters[2].text).toContain('28 Chorsa Crackers (x3)');
  });

  it('builds ORDER_DELIVERED with delivered products summary', () => {
    const orderWithProducts: WhatsAppOrderDetails = {
      ...mockOrder,
      items: [
        {
          productNameSnapshot: 'Magic Peacock Fountain',
          quantity: 2,
          sellingPriceSnapshot: '200.00',
          lineTotal: '400.00',
        },
      ],
    };
    const components = buildTemplateComponents('ORDER_DELIVERED', orderWithProducts);
    expect(components[0].parameters[2].text).toContain('Magic Peacock Fountain (x2)');
  });

  it('builds ORDER_OUT_FOR_DELIVERY with fallback when no items provided', () => {
    const components = buildTemplateComponents('ORDER_OUT_FOR_DELIVERY', mockOrder);
    expect(components[0].parameters[2].text).toBe('10 Gandhi Road, Madurai - 625001');
  });

  it('builds ORDER_CANCELLED template parameters', () => {
    const components = buildTemplateComponents('ORDER_CANCELLED', mockOrder);
    expect(components[0].parameters[0].text).toBe('Murugan Raja');
    expect(components[0].parameters[1].text).toBe('FW-20260903-1001');
  });
});

