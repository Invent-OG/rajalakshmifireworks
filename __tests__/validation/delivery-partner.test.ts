import { describe, it, expect } from 'vitest';
import { deliveryPartnerSchema } from '@/lib/validation/delivery-partner';
import { assignDeliverySchema } from '@/lib/validation/order';

describe('Delivery Partner Validation Schemas', () => {
  describe('deliveryPartnerSchema', () => {
    it('validates a correct delivery partner input with all optional fields', () => {
      const valid = {
        name: 'Rajesh Kumar',
        mobileNumber: '9876543210',
        email: 'rajesh@example.com',
        vehicleType: 'Tata Ace Mini Truck',
        vehicleNumber: 'TN 67 AB 1234',
        address: '12 Gandhi Road',
        pincode: '626123',
        notes: 'Experienced driver for South India routes',
        status: 'ACTIVE',
      };
      const result = deliveryPartnerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates minimal delivery partner with only required name and mobileNumber', () => {
      const minimal = {
        name: 'Kumar',
        mobileNumber: '9876543210',
      };
      const result = deliveryPartnerSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it('rejects invalid mobile numbers', () => {
      const invalid = {
        name: 'Rajesh',
        mobileNumber: '12345',
      };
      const result = deliveryPartnerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const invalid = {
        name: '',
        mobileNumber: '9876543210',
      };
      const result = deliveryPartnerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email if provided', () => {
      const invalid = {
        name: 'Rajesh',
        mobileNumber: '9876543210',
        email: 'not-an-email',
      };
      const result = deliveryPartnerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('assignDeliverySchema', () => {
    it('validates valid delivery partner assignment', () => {
      const valid = {
        deliveryPartnerId: 1,
        note: 'Assigned for prompt delivery',
      };
      const result = assignDeliverySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid delivery partner id', () => {
      const invalid = {
        deliveryPartnerId: -5,
      };
      const result = assignDeliverySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
