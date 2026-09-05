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

  it('builds ORDER_OUT_FOR_DELIVERY with full delivery address', () => {
    const components = buildTemplateComponents('ORDER_OUT_FOR_DELIVERY', mockOrder);
    expect(components[0].parameters[2].text).toBe('10 Gandhi Road, Madurai - 625001');
  });

  it('builds ORDER_CANCELLED template parameters', () => {
    const components = buildTemplateComponents('ORDER_CANCELLED', mockOrder);
    expect(components[0].parameters[0].text).toBe('Murugan Raja');
    expect(components[0].parameters[1].text).toBe('FW-20260903-1001');
  });
});
