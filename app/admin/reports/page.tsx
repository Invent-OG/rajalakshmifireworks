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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Revenue & Performance Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Business performance metrics, festive sales trends, and CSV data export downloads.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border/80 self-start sm:self-auto">
          <button
            onClick={() => setRange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              range === 'today'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setRange('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              range === '7days'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setRange('30days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              range === '30days'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border/80 luxury-card space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {formatCurrency(summary.totalRevenue)}
            </p>
            <p className="text-[11px] text-muted-foreground">Timeframe gross receipts</p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/80 luxury-card space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {summary.totalOrders}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {summary.completedOrdersCount} completed / {summary.cancelledOrdersCount} cancelled
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/80 luxury-card space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Order Value (AOV)</span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {formatCurrency(summary.averageOrderValue)}
            </p>
            <p className="text-[11px] text-muted-foreground">Mean cart checkout spend</p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/80 luxury-card space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Fulfillment Split</span>
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-sm font-black text-foreground mt-2">
              🚚 {summary.deliveryOrdersCount} Delivery • 🏪 {summary.pickupOrdersCount} Pickup
            </p>
            <p className="text-[11px] text-muted-foreground">Doorstep vs Counter pickups</p>
          </div>
        </div>
      )}

      {/* Top Products & Export Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top Selling Fireworks */}
        <div className="lg:col-span-8 rounded-3xl bg-card border border-border/80 luxury-card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border/80">
            <h2 className="font-extrabold text-base text-foreground tracking-tight">
              Top Performing Crackers
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked by quantity ordered and gross revenue contribution
            </p>
          </div>

          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          ) : topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Cracker Item</th>
                    <th className="px-5 py-3.5">Units Sold</th>
                    <th className="px-5 py-3.5 text-right">Revenue Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {topProducts.map((p: { name: string; quantity: number; revenue: string | number }, index: number) => (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-foreground">{p.name}</td>
                      <td className="px-5 py-4 font-mono font-bold text-foreground">
                        {p.quantity} units
                      </td>
                      <td className="px-5 py-4 font-black text-foreground text-right">
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
        <div className="lg:col-span-4 p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-4">
          <h2 className="font-extrabold text-base text-foreground tracking-tight">
            Data Exports & Audits
          </h2>
          <p className="text-xs text-muted-foreground">
            Download CSV spreadsheets for tax filing, factory reorders, or offline books.
          </p>

          <div className="space-y-2.5 pt-2">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-between font-semibold text-xs"
              onClick={() => handleExport('orders')}
            >
              <span>Export Order Register</span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full justify-between font-semibold text-xs"
              onClick={() => handleExport('products')}
            >
              <span>Export Inventory & Prices</span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full justify-between font-semibold text-xs"
              onClick={() => handleExport('customers')}
            >
              <span>Export Customer Contacts</span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
