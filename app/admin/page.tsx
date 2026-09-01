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
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Today's Gross Sales",
      value: formatCurrency(d?.todaySales ?? 0),
      trend: 'Live updates',
      icon: IndianRupee,
    },
    {
      label: "Today's Bookings",
      value: d?.todayOrders ?? 0,
      trend: `${d?.completedToday ?? 0} dispatched`,
      icon: ShoppingCart,
    },
    {
      label: 'Requires Attention',
      value: d?.pendingOrders ?? 0,
      trend: 'Pending verification',
      icon: Clock,
    },
    {
      label: 'Registered Customers',
      value: d?.totalCustomers ?? 0,
      trend: 'Buyer accounts',
      icon: Users,
    },
  ];

  const fulfillmentCounters = [
    {
      label: 'Confirmed Orders',
      value: d?.confirmedOrders ?? 0,
      href: '/admin/orders?status=CONFIRMED',
    },
    {
      label: 'Ready for Dispatch',
      value: d?.readyOrders ?? 0,
      href: '/admin/orders?status=READY',
    },
    {
      label: 'Out for Delivery',
      value: d?.outForDelivery ?? 0,
      href: '/admin/orders?status=OUT_FOR_DELIVERY',
    },
    {
      label: 'Low Stock Alerts',
      value: d?.lowStockProducts ?? 0,
      href: '/admin/inventory',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time status of your Sivakasi fireworks sales, orders, and inventory.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-medium text-muted-foreground self-start sm:self-auto shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Live Store Operations</span>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="p-5 rounded-2xl bg-card border border-border space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {kpi.label}
              </span>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-foreground-secondary border border-border">
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {kpi.value}
              </p>
              <p className="text-[11px] text-muted-foreground">
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
            className="p-4 rounded-xl bg-card border border-border hover:border-neutral-300 transition-all flex items-center justify-between"
          >
            <div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-60" />
          </Link>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base text-foreground tracking-tight">
              Recent Orders
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest transactions placed on the storefront
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-foreground hover:text-brand transition-colors flex items-center gap-1"
          >
            All orders <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3 text-right">Order Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {d?.recentOrders && d.recentOrders.length > 0 ? (
                d.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-foreground">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="hover:underline"
                      >
                        {order.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {order.customerNameSnapshot}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {order.items.length} items
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground text-right">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {formatDateTime(order.placedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-medium text-foreground hover:underline"
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
