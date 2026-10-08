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

import { withAdminShell } from './admin-shell';

function AdminReportsPageContent() {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Business performance metrics, festive sales trends, and CSV data export downloads.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card border border-border self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setRange('today')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              range === 'today'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#242424]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setRange('7days')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              range === '7days'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#242424]'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setRange('30days')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              range === '30days'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary dark:hover:bg-[#242424]'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-semibold">Gross Sales</span>
              <div className="h-10 w-10 rounded-xl bg-secondary dark:bg-[#242424] text-foreground flex items-center justify-center border border-border">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {formatCurrency(summary.totalRevenue)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">Selected period gross</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-semibold">Total Orders</span>
              <div className="h-10 w-10 rounded-xl bg-secondary dark:bg-[#242424] text-foreground flex items-center justify-center border border-border">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {summary.totalOrders}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {summary.completedOrdersCount} completed • {summary.cancelledOrdersCount} cancelled
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-semibold">Avg Order Value (AOV)</span>
              <div className="h-10 w-10 rounded-xl bg-secondary dark:bg-[#242424] text-foreground flex items-center justify-center border border-border">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {formatCurrency(summary.averageOrderValue)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">Mean cart spend</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-semibold">Fulfillment Ratio</span>
              <div className="h-10 w-10 rounded-xl bg-secondary dark:bg-[#242424] text-foreground flex items-center justify-center border border-border">
                <Truck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground mt-1">
              {summary.deliveryOrdersCount} Delivery • {summary.pickupOrdersCount} Pickup
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">Doorstep vs Counter pickup</p>
          </div>
        </div>
      )}

      {/* Top Products & Export Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top Selling Fireworks */}
        <div className="lg:col-span-8 rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold text-lg sm:text-xl text-foreground tracking-tight">
              Top Selling Fireworks
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ranked by quantity ordered and gross revenue contribution
            </p>
          </div>

          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-base">
                <thead className="bg-secondary/50 dark:bg-[#242424]/50 text-muted-foreground border-b border-border text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-4">Cracker Item</th>
                    <th className="px-5 py-4">Units Sold</th>
                    <th className="px-5 py-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topProducts.map((p: { name: string; quantity: number; revenue: string | number }, index: number) => (
                    <tr key={index} className="hover:bg-secondary/30 dark:hover:bg-[#242424]/30 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground">{p.name}</td>
                      <td className="px-5 py-4 font-mono font-medium text-muted-foreground">
                        {p.quantity} units
                      </td>
                      <td className="px-5 py-4 font-bold text-foreground text-right font-mono">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-14 text-muted-foreground text-sm font-medium">
              No sales recorded for this timeframe.
            </div>
          )}
        </div>

        {/* Data Exports Card */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
          <h2 className="font-bold text-lg sm:text-xl text-foreground tracking-tight">
            Data Exports
          </h2>
          <p className="text-sm text-muted-foreground">
            Download CSV spreadsheets for tax filing, factory reorders, or offline books.
          </p>

          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full h-12 justify-between font-bold text-sm px-4 rounded-xl cursor-pointer hover:bg-secondary dark:hover:bg-[#242424]"
              onClick={() => handleExport('orders')}
            >
              <span>Export Order Register</span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 justify-between font-bold text-sm px-4 rounded-xl cursor-pointer hover:bg-secondary dark:hover:bg-[#242424]"
              onClick={() => handleExport('products')}
            >
              <span>Export Products & Stock</span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 justify-between font-bold text-sm px-4 rounded-xl cursor-pointer hover:bg-secondary dark:hover:bg-[#242424]"
              onClick={() => handleExport('customers')}
            >
              <span>Export Customer List</span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAdminShell(AdminReportsPageContent);

