import { describe, it, expect } from 'vitest';
import { customerSchema, addressSchema } from '@/lib/validation/customer';
import { checkoutSchema, orderTrackingSchema } from '@/lib/validation/order';

describe('Validation Schemas', () => {
  describe('Customer Schema', () => {
    it('accepts valid 10-digit Indian mobile numbers starting with 6-9', () => {
      const valid = customerSchema.safeParse({
        name: 'Guna Sekar',
        mobile: '9840123456',
        email: 'guna@example.com',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects invalid mobile numbers (too short, wrong prefix, letters)', () => {
      expect(customerSchema.safeParse({ name: 'Test', mobile: '1234567890' }).success).toBe(false);
      expect(customerSchema.safeParse({ name: 'Test', mobile: '984012' }).success).toBe(false);
      expect(customerSchema.safeParse({ name: 'Test', mobile: '98401234567' }).success).toBe(false);
      expect(customerSchema.safeParse({ name: 'Test', mobile: 'abcdefghij' }).success).toBe(false);
    });

    it('validates 6-digit Indian postal pincodes', () => {
      expect(
        addressSchema.safeParse({
          address: '123 Cross St',
          city: 'Sivakasi',
          pincode: '626123',
        }).success
      ).toBe(true);

      expect(
        addressSchema.safeParse({
          address: '123 Cross St',
          city: 'Sivakasi',
          pincode: '62612', // 5 digits
        }).success
      ).toBe(false);
    });
  });

  describe('Checkout & Tracking Schema', () => {
    it('validates a complete checkout payload', () => {
      const payload = {
        customer: {
          name: 'Anand',
          mobile: '9876543210',
        },
        fulfillmentType: 'DELIVERY',
        address: {
          address: '42 Gandhi Road',
          city: 'Madurai',
          pincode: '625001',
        },
        items: [
          { productId: 1, quantity: 2 },
          { productId: 5, quantity: 1 },
        ],
        idempotencyKey: 'idemp-test-key-12345',
      };

      const result = checkoutSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects checkout with empty items list', () => {
      const payload = {
        customer: { name: 'Anand', mobile: '9876543210' },
        fulfillmentType: 'PICKUP',
        items: [],
        idempotencyKey: 'key-123',
      };
      expect(checkoutSchema.safeParse(payload).success).toBe(false);
    });

    it('validates order tracking lookup with mobile number', () => {
      expect(
        orderTrackingSchema.safeParse({
          mobile: '9876543210',
          invoiceNumber: 'FW-20260830-0001',
        }).success
      ).toBe(true);

      expect(
        orderTrackingSchema.safeParse({
          mobile: 'invalid',
        }).success
      ).toBe(false);
    });
  });
});
