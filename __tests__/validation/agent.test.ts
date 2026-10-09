import { describe, it, expect } from 'vitest';
import { createAgentSchema, updateAgentSchema, agentFilterSchema } from '@/lib/validation/agent';

describe('Sales Agent Validation Schemas', () => {
  describe('createAgentSchema', () => {
    it('validates a complete agent registration payload', () => {
      const valid = {
        name: 'Suresh Kumar',
        mobile: '9842198421',
        email: 'suresh@rajalakshmifireworks.com',
        location: 'Madurai, TN',
        agentCode: 'AGT-001',
        referralCode: 'SURESH01',
        joiningDate: '2026-05-10',
        isActive: true,
      };

      const result = createAgentSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.referralCode).toBe('SURESH01');
      }
    });

    it('validates minimal agent payload with only name and mobile', () => {
      const minimal = {
        name: 'Guna',
        mobile: '9876543210',
      };

      const result = createAgentSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });

    it('rejects invalid mobile numbers', () => {
      const invalidMobiles = ['1234567890', '5876543210', '98765', 'abcdefghij', ''];
      for (const mobile of invalidMobiles) {
        const result = createAgentSchema.safeParse({
          name: 'Agent Test',
          mobile,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects invalid email formats when email is provided', () => {
      const invalid = {
        name: 'Agent Test',
        mobile: '9876543210',
        email: 'not-an-email',
      };
      const result = createAgentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('allows empty or null email', () => {
      const emptyEmail = {
        name: 'Agent Test',
        mobile: '9876543210',
        email: '',
      };
      const result = createAgentSchema.safeParse(emptyEmail);
      expect(result.success).toBe(true);
    });

    it('converts referral code to uppercase and trims whitespace', () => {
      const input = {
        name: 'Anand Kumar',
        mobile: '9876543210',
        referralCode: ' anand99 ',
      };
      const result = createAgentSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.referralCode).toBe('ANAND99');
      }
    });

    it('rejects referral codes with special characters', () => {
      const invalid = {
        name: 'Anand Kumar',
        mobile: '9876543210',
        referralCode: 'ANAND@99',
      };
      const result = createAgentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('updateAgentSchema', () => {
    it('allows partial updates with valid fields', () => {
      const update = {
        name: 'Suresh K',
        isActive: false,
        location: 'Coimbatore',
      };
      const result = updateAgentSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('validates mobile number if updated', () => {
      const invalid = {
        mobile: 'invalid',
      };
      const result = updateAgentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('allows toggling agent active status without changing other fields', () => {
      const toggle = {
        isActive: false,
      };
      const result = updateAgentSchema.safeParse(toggle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(false);
      }
    });
  });

  describe('agentFilterSchema', () => {
    it('sets default pagination values and accepts search filters', () => {
      const parsed = agentFilterSchema.parse({
        page: '2',
        limit: '25',
        search: 'Suresh',
        status: 'active',
      });

      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(25);
      expect(parsed.search).toBe('Suresh');
      expect(parsed.status).toBe('ACTIVE');
    });

    it('applies defaults when empty query params provided', () => {
      const parsed = agentFilterSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(25);
      expect(parsed.status).toBe('ALL');
    });
  });
});
