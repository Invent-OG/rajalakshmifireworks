'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  IndianRupee,
  Clock,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  todayOrders: number;
  todaySales: number;
  pendingOrders: number;
  confirmedOrders: number;
  readyOrders: number;
  outForDelivery: number;
  completedToday: number;
  totalCustomers: number;
  lowStockProducts: number;
  recentOrders: Array<{
    id: number;
    invoiceNumber: string;
    customerNameSnapshot: string;
    totalAmount: string;
    orderStatus: string;
    placedAt: string;
    items: Array<{ id: number }>;
  }>;
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<{ dashboard: DashboardData }>({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => fetch('/api/admin/dashboard').then((r) => r.json()),
    refetchInterval: 30000,
  });

  const d = data?.dashboard;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Today's Gross Sales",
      value: formatCurrency(d?.todaySales ?? 0),
      trend: 'Live updates',
      icon: IndianRupee,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      label: "Today's Bookings",
      value: d?.todayOrders ?? 0,
      trend: `${d?.completedToday ?? 0} dispatched`,
      icon: ShoppingCart,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    },
    {
      label: 'Requires Attention',
      value: d?.pendingOrders ?? 0,
      trend: 'Pending review',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      label: 'Customer Reach',
      value: d?.totalCustomers ?? 0,
      trend: 'Registered buyers',
      icon: Users,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    },
  ];

  const fulfillmentCounters = [
    {
      label: 'Confirmed Orders',
      value: d?.confirmedOrders ?? 0,
      href: '/admin/orders?status=CONFIRMED',
      color: 'border-sky-500/30 text-sky-700 dark:text-sky-400',
    },
    {
      label: 'Ready for Dispatch',
      value: d?.readyOrders ?? 0,
      href: '/admin/orders?status=READY',
      color: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Out for Delivery',
      value: d?.outForDelivery ?? 0,
      href: '/admin/orders?status=OUT_FOR_DELIVERY',
      color: 'border-amber-500/30 text-amber-700 dark:text-amber-400',
    },
    {
      label: 'Low Stock Alerts',
      value: d?.lowStockProducts ?? 0,
      href: '/admin/inventory',
      color: 'border-rose-500/30 text-rose-700 dark:text-rose-400',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Store Overview & Operations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time status of your Sivakasi fireworks sales, orders, and fulfillment pipelines.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-muted-foreground self-start sm:self-auto shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Operations</span>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="p-5 rounded-2xl bg-card border border-border/80 luxury-card space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                {kpi.label}
              </span>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                <kpi.icon className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {kpi.value}
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {kpi.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Fulfillment Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fulfillmentCounters.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`p-4 rounded-2xl bg-card border luxury-card hover:border-primary/40 flex items-center justify-between ${card.color}`}
          >
            <div>
              <p className="text-2xl font-black">{card.value}</p>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">{card.label}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 opacity-50" />
          </Link>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-3xl bg-card border border-border/80 luxury-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border/80 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
              Recent Order Bookings
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest transactions placed on the storefront
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
          >
            All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Invoice</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Order Total</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {d?.recentOrders && d.recentOrders.length > 0 ? (
                d.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-foreground">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-primary hover:underline"
                      >
                        {order.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      {order.customerNameSnapshot}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {order.items.length} items
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {formatDateTime(order.placedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-xs">
                    No orders booked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
