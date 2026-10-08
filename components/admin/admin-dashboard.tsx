'use client';

import { useRef } from 'react';
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
  Printer,
} from 'lucide-react';
import Link from '@/components/ui/link';
import { useGSAP } from '@gsap/react';
import { gsap, isReducedMotion } from '@/lib/motion';

interface DashboardData {
  todayOrders: number;
  todaySales: number;
  newOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  assignedOrders: number;
  readyOrders: number;
  outForDelivery: number;
  completedToday: number;
  deliveredToday: number;
  totalCustomers: number;
  activeDeliveryPartners: number;
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

function KpiValueCounter({
  target,
  isCurrency = false,
}: {
  target: number;
  isCurrency?: boolean;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);

  useGSAP(() => {
    if (animatedRef.current || isReducedMotion() || !nodeRef.current) return;
    animatedRef.current = true;

    const counterObj = { val: 0 };
    gsap.to(counterObj, {
      val: target,
      duration: 0.75,
      ease: 'power2.out',
      onUpdate: () => {
        if (nodeRef.current) {
          nodeRef.current.textContent = isCurrency
            ? formatCurrency(Math.round(counterObj.val))
            : Math.round(counterObj.val).toLocaleString('en-IN');
        }
      },
    });
  }, [target]);

  return (
    <span ref={nodeRef}>
      {isCurrency ? formatCurrency(target) : target.toLocaleString('en-IN')}
    </span>
  );
}

import { withAdminShell } from './admin-shell';

function AdminDashboardPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery<{ dashboard: DashboardData }>({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => fetch('/api/admin/dashboard').then((r) => r.json()),
    refetchInterval: 30000,
  });

  const d = data?.dashboard;

  useGSAP(
    () => {
      if (isReducedMotion() || !containerRef.current || isLoading) return;

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(
        '.admin-kpi-card',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 }
      )
        .fromTo(
          '.admin-fulfillment-card',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.04 },
          '-=0.2'
        )
        .fromTo(
          '.admin-table-card',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45 },
          '-=0.15'
        );
    },
    { dependencies: [isLoading], scope: containerRef }
  );

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
      valueNumber: d?.todaySales ?? 0,
      isCurrency: true,
      trend: 'Live updates',
      icon: IndianRupee,
    },
    {
      label: "Today's Bookings",
      valueNumber: d?.todayOrders ?? 0,
      isCurrency: false,
      trend: `${d?.completedToday ?? 0} dispatched`,
      icon: ShoppingCart,
    },
    {
      label: 'Requires Attention',
      valueNumber: d?.pendingOrders ?? 0,
      isCurrency: false,
      trend: 'Pending verification',
      icon: Clock,
    },
    {
      label: 'Registered Customers',
      valueNumber: d?.totalCustomers ?? 0,
      isCurrency: false,
      trend: 'Buyer accounts',
      icon: Users,
    },
  ];

  const fulfillmentCounters = [
    {
      label: 'New Orders',
      value: d?.newOrders ?? 0,
      href: '/admin/orders?status=NEW',
    },
    {
      label: 'Confirmed Orders',
      value: d?.confirmedOrders ?? 0,
      href: '/admin/orders?status=CONFIRMED',
    },
    {
      label: 'Assigned Orders',
      value: d?.assignedOrders ?? 0,
      href: '/admin/orders?status=ASSIGNED',
    },
    {
      label: 'Out for Delivery',
      value: d?.outForDelivery ?? 0,
      href: '/admin/orders?status=OUT_FOR_DELIVERY',
    },
    {
      label: 'Active Delivery Partners',
      value: d?.activeDeliveryPartners ?? 0,
      href: '/admin/delivery-partners',
    },
    {
      label: 'Low Stock Alerts',
      value: d?.lowStockProducts ?? 0,
      href: '/admin/inventory',
    },
  ];

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Real-time status of your Sivakasi fireworks sales, orders, and inventory.
          </p>
        </div>

        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card border border-border text-sm font-semibold text-foreground self-start sm:self-auto shadow-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Store Operations</span>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="admin-kpi-card p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                {kpi.label}
              </span>
              <div className="h-10 w-10 rounded-xl bg-secondary dark:bg-[#242424] flex items-center justify-center text-foreground border border-border">
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                <KpiValueCounter
                  target={kpi.valueNumber}
                  isCurrency={kpi.isCurrency}
                />
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {kpi.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Fulfillment Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {fulfillmentCounters.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="admin-fulfillment-card p-5 rounded-2xl bg-card border border-border hover:bg-secondary/40 dark:hover:bg-[#242424]/40 hover:border-neutral-500 transition-all flex items-center justify-between group shadow-xs"
          >
            <div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-sm font-semibold text-muted-foreground mt-1 group-hover:text-foreground transition-colors">{card.label}</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="admin-table-card rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg sm:text-xl text-foreground tracking-tight">
              Recent Orders
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Latest transactions placed on the storefront
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-sm font-bold text-foreground hover:text-brand transition-colors flex items-center gap-1.5"
          >
            All orders <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-base">
            <thead className="bg-secondary/50 dark:bg-[#242424]/50 text-muted-foreground border-b border-border text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-4">Invoice</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4 text-right">Order Total</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {d?.recentOrders && d.recentOrders.length > 0 ? (
                d.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/30 dark:hover:bg-[#242424]/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-foreground">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="hover:underline"
                      >
                        {order.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {order.customerNameSnapshot}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {order.items.length} items
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground text-right font-mono">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.orderStatus} className="text-xs px-3 py-1 font-semibold" />
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {formatDateTime(order.placedAt)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders/${order.id}/print`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card dark:bg-[#1a1a1a] hover:bg-muted dark:hover:bg-[#262626] text-foreground text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                          title="Print Dispatch Slip"
                        >
                          <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Print Slip</span>
                        </Link>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                          title="Inspect Order"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-muted-foreground text-sm font-medium">
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

export default withAdminShell(AdminDashboardPageContent);

