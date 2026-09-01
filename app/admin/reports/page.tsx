'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/format';
import {
  TrendingUp,
  Download,
  IndianRupee,
  ShoppingCart,
  Truck,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [range, setRange] = useState<'today' | '7days' | '30days'>('30days');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'sales', { range }],
    queryFn: () => fetch(`/api/admin/reports?range=${range}`).then((r) => r.json()),
  });

  const summary = data?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    completedOrdersCount: 0,
    cancelledOrdersCount: 0,
    deliveryOrdersCount: 0,
    pickupOrdersCount: 0,
    averageOrderValue: 0,
  };

  const topProducts = data?.topProducts || [];

  const handleExport = (type: 'orders' | 'products' | 'customers') => {
    window.open(`/api/admin/export?type=${type}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Timeframe Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Business performance metrics, festive sales trends, and CSV data export downloads.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border self-start sm:self-auto">
          <button
            onClick={() => setRange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              range === 'today'
                ? 'bg-foreground text-background font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setRange('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              range === '7days'
                ? 'bg-foreground text-background font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setRange('30days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              range === '30days'
                ? 'bg-foreground text-background font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Gross Sales</span>
              <div className="h-8 w-8 rounded-lg bg-muted text-foreground-secondary flex items-center justify-center border border-border">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalRevenue)}
            </p>
            <p className="text-[11px] text-muted-foreground">Selected period gross</p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Orders</span>
              <div className="h-8 w-8 rounded-lg bg-muted text-foreground-secondary flex items-center justify-center border border-border">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {summary.totalOrders}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {summary.completedOrdersCount} completed • {summary.cancelledOrdersCount} cancelled
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Avg Order Value (AOV)</span>
              <div className="h-8 w-8 rounded-lg bg-muted text-foreground-secondary flex items-center justify-center border border-border">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.averageOrderValue)}
            </p>
            <p className="text-[11px] text-muted-foreground">Mean cart spend</p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Fulfillment Ratio</span>
              <div className="h-8 w-8 rounded-lg bg-muted text-foreground-secondary flex items-center justify-center border border-border">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-sm font-bold text-foreground mt-2">
              {summary.deliveryOrdersCount} Delivery • {summary.pickupOrdersCount} Pickup
            </p>
            <p className="text-[11px] text-muted-foreground">Doorstep vs Counter pickup</p>
          </div>
        </div>
      )}

      {/* Top Products & Export Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top Selling Fireworks */}
        <div className="lg:col-span-8 rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-base text-foreground tracking-tight">
              Top Selling Fireworks
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked by quantity ordered and gross revenue contribution
            </p>
          </div>

          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Cracker Item</th>
                    <th className="px-5 py-3">Units Sold</th>
                    <th className="px-5 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topProducts.map((p: { name: string; quantity: number; revenue: string | number }, index: number) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">{p.name}</td>
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">
                        {p.quantity} units
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground text-right">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No sales recorded for this timeframe.
            </div>
          )}
        </div>

        {/* Data Exports Card */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="font-semibold text-base text-foreground tracking-tight">
            Data Exports
          </h2>
          <p className="text-xs text-muted-foreground">
            Download CSV spreadsheets for tax filing, factory reorders, or offline books.
          </p>

          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-between font-medium text-xs"
              onClick={() => handleExport('orders')}
            >
              <span>Export Order Register</span>
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full justify-between font-medium text-xs"
              onClick={() => handleExport('products')}
            >
              <span>Export Products & Stock</span>
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full justify-between font-medium text-xs"
              onClick={() => handleExport('customers')}
            >
              <span>Export Customer List</span>
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
