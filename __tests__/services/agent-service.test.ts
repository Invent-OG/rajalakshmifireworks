import { describe, it, expect } from 'vitest';
import { exportAgentsToExcel, exportAgentOrdersToExcel } from '@/lib/services/agent-service';
import * as XLSX from 'xlsx';

describe('Sales Agent Service & Attribution Tests', () => {
  describe('exportAgentsToExcel', () => {
    it('generates a valid Excel spreadsheet buffer from agent records', () => {
      const mockAgents = [
        {
          id: 1,
          agentCode: 'AGT-001',
          name: 'Guna Sekaran',
          referralCode: 'GUNA01',
          mobile: '9842100001',
          email: 'guna@rajalakshmifireworks.com',
          location: 'Sivakasi',
          joiningDate: new Date('2026-01-15'),
          isActive: true,
          totalOrders: 10,
          deliveredOrders: 8,
          cancelledOrders: 1,
          totalOrderValue: 85000,
          deliveredOrderValue: 72000,
        },
        {
          id: 2,
          agentCode: 'AGT-002',
          name: 'Rajesh Kannan',
          referralCode: 'RAJ02',
          mobile: '9842100002',
          email: null,
          location: 'Madurai',
          joiningDate: new Date('2026-02-01'),
          isActive: false,
          totalOrders: 4,
          deliveredOrders: 3,
          cancelledOrders: 0,
          totalOrderValue: 31000,
          deliveredOrderValue: 25000,
        },
      ];

      const buffer = exportAgentsToExcel(mockAgents);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);

      // Verify workbook parsing
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('Sales Agents');

      const worksheet = workbook.Sheets['Sales Agents'];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
      expect(rows.length).toBe(2);
      expect(rows[0]['Agent ID']).toBe('AGT-001');
      expect(rows[0]['Agent Name']).toBe('Guna Sekaran');
      expect(rows[0]['Referral Code']).toBe('GUNA01');
      expect(rows[0]['Delivered Sales Value (INR)']).toBe(72000);
      expect(rows[1]['Status']).toBe('Inactive');
    });
  });

  describe('exportAgentOrdersToExcel', () => {
    it('generates a valid order history spreadsheet for a sales agent', () => {
      const mockAgent = {
        id: 1,
        agentCode: 'AGT-001',
        name: 'Guna Sekaran',
        referralCode: 'GUNA01',
        mobile: '9842100001',
        email: 'guna@rajalakshmifireworks.com',
        location: 'Sivakasi',
        joiningDate: new Date('2026-01-15'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrders = [
        {
          id: 101,
          invoiceNumber: 'INV-2026-001',
          placedAt: new Date('2026-09-01'),
          customerName: 'Karthik',
          customerMobile: '9876543210',
          fulfillmentType: 'DELIVERY',
          orderStatus: 'DELIVERED',
          paymentStatus: 'PAID',
          subtotal: '12000.00',
          deliveryCharge: '350.00',
          totalAmount: '12350.00',
          referralCode: 'GUNA01',
          attributionSource: 'LINK',
        },
        {
          id: 102,
          invoiceNumber: 'INV-2026-002',
          placedAt: new Date('2026-09-05'),
          customerName: 'Manoj',
          customerMobile: '9765432109',
          fulfillmentType: 'PICKUP',
          orderStatus: 'CANCELLED',
          paymentStatus: 'PENDING',
          subtotal: '5000.00',
          deliveryCharge: '0.00',
          totalAmount: '5000.00',
          referralCode: 'GUNA01',
          attributionSource: 'CODE',
        },
      ];

      const buffer = exportAgentOrdersToExcel(mockAgent, mockOrders);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('Orders - AGT-001');

      const worksheet = workbook.Sheets['Orders - AGT-001'];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
      expect(rows.length).toBe(2);
      expect(rows[0]['Invoice Number']).toBe('INV-2026-001');
      expect(rows[0]['Attribution Source']).toBe('Referral Link');
      expect(rows[0]['Total Amount (INR)']).toBe(12350);
      expect(rows[1]['Attribution Source']).toBe('Entered Code');
      expect(rows[1]['Order Status']).toBe('CANCELLED');
    });
  });

  describe('Business Metrics Aggregation Rules', () => {
    it('verifies that cancelled orders must be excluded from delivered revenue', () => {
      const orders = [
        { orderStatus: 'DELIVERED', totalAmount: 10000 },
        { orderStatus: 'CONFIRMED', totalAmount: 5000 },
        { orderStatus: 'CANCELLED', totalAmount: 8000 },
      ];

      const totalAttributedValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const deliveredSalesValue = orders
        .filter((o) => o.orderStatus === 'DELIVERED')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      expect(totalAttributedValue).toBe(23000);
      expect(deliveredSalesValue).toBe(10000); // 8000 cancelled order is strictly excluded
    });

    it('calculates average order value safely without division by zero', () => {
      const calculateAov = (totalValue: number, orderCount: number) => {
        return orderCount > 0 ? Math.round((totalValue / orderCount) * 100) / 100 : 0;
      };

      expect(calculateAov(0, 0)).toBe(0);
      expect(calculateAov(25000, 5)).toBe(5000);
      expect(calculateAov(10000, 3)).toBe(3333.33);
    });
  });
});
