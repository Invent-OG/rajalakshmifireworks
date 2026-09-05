import { describe, it, expect } from 'vitest';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validation/admin';

describe('Admin Profile & Password Validation Schemas', () => {
  describe('updateProfileSchema', () => {
    it('accepts valid name and email address', () => {
      const valid = updateProfileSchema.safeParse({
        name: 'Guna Sekar',
        email: 'guna@rajalakshmifireworks.com',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.name).toBe('Guna Sekar');
        expect(valid.data.email).toBe('guna@rajalakshmifireworks.com');
      }
    });

    it('trims leading and trailing whitespace from input', () => {
      const result = updateProfileSchema.safeParse({
        name: '   Rajalakshmi Admin   ',
        email: '   admin@rajalakshmi.com   ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Rajalakshmi Admin');
        expect(result.data.email).toBe('admin@rajalakshmi.com');
      }
    });

    it('rejects invalid email formats', () => {
      expect(updateProfileSchema.safeParse({ name: 'Admin', email: 'notanemail' }).success).toBe(false);
      expect(updateProfileSchema.safeParse({ name: 'Admin', email: '@domain.com' }).success).toBe(false);
      expect(updateProfileSchema.safeParse({ name: 'Admin', email: 'user@' }).success).toBe(false);
    });

    it('rejects short or empty names', () => {
      expect(updateProfileSchema.safeParse({ name: 'A', email: 'admin@test.com' }).success).toBe(false);
      expect(updateProfileSchema.safeParse({ name: '   ', email: 'admin@test.com' }).success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('accepts valid password update when current password is provided and new passwords match', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewSecurePassword2026@',
        confirmPassword: 'NewSecurePassword2026@',
      });
      expect(result.success).toBe(true);
    });

    it('rejects when new password is less than 8 characters', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'Short1!',
        confirmPassword: 'Short1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('at least 8 characters');
      }
    });

    it('rejects when confirm password does not match new password', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'SecurePassword123!',
        confirmPassword: 'DifferentPassword456!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('do not match');
      }
    });

    it('rejects when current password is blank', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
      });
      expect(result.success).toBe(false);
    });
  });
});
