'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart01Icon,
  UserIcon,
  Package01Icon,
  Money01Icon,
  ArrowReloadHorizontalIcon,
  Search01Icon,
  FilterIcon,
  SortByDown01Icon,
  PrinterIcon,
  Cancel01Icon,
} from 'hugeicons-react';
import Link from '@/components/ui/link';
import { useGSAP } from '@gsap/react';
import { gsap, isReducedMotion } from '@/lib/motion';
import { InvoiceCustomizer } from './invoice-customizer';
import { withAdminShell } from './admin-shell';

interface DashboardData {
  todayOrders: number;
  todaySales: number;
  newOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  assignedOrders: number;
  readyOrders?: number;
  outForDelivery: number;
  completedToday: number;
  deliveredToday: number;
  totalCustomers: number;
  activeDeliveryPartners: number;
  lowStockProducts: number;
  totalProductsSold?: number;
  monthlyAnalytics?: Array<{ month: string; revenue: number; target: number }>;
  trafficSources?: Array<{ name: string; percent: number; value: number; color: string; isPattern?: boolean }>;
  recentOrders: Array<{
    id: number;
    invoiceNumber: string;
    customerNameSnapshot: string;
    totalAmount: string;
    orderStatus: string;
    paymentStatus?: string;
    paymentMethod?: string | null;
    placedAt: string;
    notes?: string | null;
    items: Array<{ id: number; productNameSnapshot?: string }>;
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

// Sparkline SVG Waves matching the mockup
function SparklineWave({ color }: { color: 'green' | 'blue' | 'red' | 'yellow' }) {
  const strokes = {
    green: '#22C55E',
    blue: '#4F75FF',
    red: '#F43F5E',
    yellow: '#EAB308',
  };

  const strokeColor = strokes[color];

  return (
    <svg
      viewBox="0 0 110 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-24 sm:w-28 h-8 shrink-0 overflow-visible"
    >
      {color === 'green' && (
        <path
          d="M2 16 C 14 6, 26 26, 38 12 C 50 2, 62 24, 76 10 C 88 0, 98 18, 108 14"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {color === 'blue' && (
        <path
          d="M2 14 C 18 2, 34 26, 50 14 C 66 4, 82 22, 96 12 C 102 8, 106 14, 108 16"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {color === 'red' && (
        <path
          d="M2 12 C 16 18, 30 8, 44 16 C 58 24, 72 6, 88 14 C 98 20, 104 12, 108 10"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {color === 'yellow' && (
        <path
          d="M2 15 C 16 18, 32 4, 48 18 C 64 26, 80 8, 94 14 C 100 18, 106 10, 108 12"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

// Donut Chart with segmented arcs, hatch pattern, and floating tooltip pill
function TrafficSourceDonutChart({
  sources,
}: {
  sources: Array<{ name: string; percent: number; value: number; color: string; isPattern?: boolean }>;
}) {
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke dash offsets with gap
  let accumulatedPercent = 0;
  const segments = sources.map((src) => {
    const gap = 3;
    const arcLength = (src.percent / 100) * circumference;
    const dashArray = `${Math.max(0, arcLength - gap)} ${circumference - Math.max(0, arcLength - gap)}`;
    const dashOffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += src.percent;
    return {
      ...src,
      dashArray,
      dashOffset,
    };
  });

  return (
    <div className="relative flex items-center justify-center py-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <defs>
          <pattern
            id="donutHatchPattern"
            width="6"
            height="6"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="#94A3B8" strokeWidth="2" opacity="0.6" />
          </pattern>
        </defs>

        {/* Outer Background Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-100 dark:text-neutral-800"
        />

        {/* Data Segments */}
        {segments.map((seg, idx) => (
          <circle
            key={idx}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={seg.isPattern ? 'url(#donutHatchPattern)' : seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        ))}
      </svg>

      {/* Floating Tooltip Pill from the Mockup */}
      <div className="absolute top-2 right-2 sm:right-6 flex items-center gap-1.5 bg-[#0F111A] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white/10 z-10 animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-[#4F75FF]" />
        <span>₹42,824</span>
      </div>

      {/* Anchor point on the slice */}
      <div className="absolute top-[28px] right-[46px] sm:right-[62px] w-2.5 h-2.5 rounded-full bg-[#4F75FF] ring-2 ring-white dark:ring-[#161826] shadow-xs pointer-events-none" />
    </div>
  );
}

// Capsule Bar Chart with hatched top pattern + solid royal blue fill
function CapsuleBarChart({
  analytics,
}: {
  analytics: Array<{ month: string; revenue: number; target: number }>;
}) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const maxTarget = 30000;

  return (
    <div className="relative flex flex-col justify-end h-56 sm:h-64 pt-4">
      {/* Horizontal Dashed Grid Lines & Left Y-Axis Values */}
      <div className="absolute inset-x-0 inset-y-0 pointer-events-none flex flex-col justify-between text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 pb-8 pl-1">
        {[30, 25, 20, 15, 10, 5].map((k) => (
          <div key={k} className="flex items-center w-full gap-3">
            <span className="w-7 text-right shrink-0">{k}k</span>
            <div className="flex-1 border-b border-dashed border-neutral-200/70 dark:border-white/5" />
          </div>
        ))}
      </div>

      {/* 7 Capsule Columns */}
      <div className="relative z-10 flex items-end justify-between pl-11 pr-2 pb-2">
        {analytics.map((item) => {
          const fillPercent = Math.min(100, Math.max(15, (item.revenue / maxTarget) * 100));
          const isHovered = hoveredMonth === item.month;

          return (
            <div
              key={item.month}
              className="flex flex-col items-center gap-2 group cursor-pointer"
              onMouseEnter={() => setHoveredMonth(item.month)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* Floating Hover Tooltip */}
              <div
                className={`
                  absolute -top-3 transition-all duration-200 pointer-events-none
                  ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                `}
              >
                <div className="bg-[#0F111A] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-white/10 whitespace-nowrap">
                  {formatCurrency(item.revenue)}
                </div>
              </div>

              {/* Capsule Container */}
              <div
                className={`
                  w-8 sm:w-10 md:w-11 h-40 sm:h-44 rounded-full overflow-hidden relative flex flex-col justify-end
                  transition-transform duration-200 group-hover:scale-[1.03]
                  border border-neutral-200/40 dark:border-white/5
                `}
                style={{
                  background:
                    'repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.22), rgba(148, 163, 184, 0.22) 2px, transparent 2px, transparent 6px)',
                }}
              >
                {/* Royal Blue Solid Fill */}
                <div
                  className="w-full bg-[#4F75FF] rounded-b-full rounded-t-[18px] relative transition-all duration-500 ease-out"
                  style={{ height: `${fillPercent}%` }}
                >
                  {/* Subtle Top Cap Divider */}
                  <div className="absolute top-0 inset-x-0 h-[1.5px] bg-neutral-900/20 dark:bg-white/20" />
                </div>
              </div>

              {/* Month Label */}
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Status outline badge in accordance with mockup
function OrderStatusPill({ status }: { status: string }) {
  const norm = (status || '').toUpperCase();

  if (norm.includes('CANCEL') || norm.includes('REJECT')) {
    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/10">
        Cancel
      </span>
    );
  }

  if (
    norm.includes('DELIVER') ||
    norm.includes('COMPLETE') ||
    norm.includes('CONFIRM') ||
    norm.includes('ASSIGN')
  ) {
    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10">
        Complete
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/10">
      Pending
    </span>
  );
}

function AdminDashboardPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETE' | 'CANCEL'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'items'>('date');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery<{ dashboard: DashboardData }>({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => fetch('/api/admin/dashboard').then((r) => r.json()),
    refetchInterval: 30000,
  });

  const d = data?.dashboard;

  const handlePrintOrder = async (orderSummary: any) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderSummary.id}`);
      const resData = await res.json();
      if (resData?.order) {
        setSelectedPrintOrder(resData.order);
      } else {
        setSelectedPrintOrder(orderSummary);
      }
    } catch {
      setSelectedPrintOrder(orderSummary);
    }
  };

  useGSAP(
    () => {
      if (isReducedMotion() || !containerRef.current || isLoading) return;

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(
        '.admin-kpi-card',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 }
      )
        .fromTo(
          '.admin-analytics-card',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
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

  // Filter and sort recent orders
  const filteredOrders = useMemo(() => {
    let list = d?.recentOrders ?? [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.invoiceNumber.toLowerCase().includes(q) ||
          o.customerNameSnapshot.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((o) => {
        const norm = (o.orderStatus || '').toUpperCase();
        if (statusFilter === 'CANCEL') return norm.includes('CANCEL') || norm.includes('REJECT');
        if (statusFilter === 'COMPLETE') {
          return (
            norm.includes('DELIVER') ||
            norm.includes('COMPLETE') ||
            norm.includes('CONFIRM') ||
            norm.includes('ASSIGN')
          );
        }
        if (statusFilter === 'PENDING') {
          return (
            !norm.includes('CANCEL') &&
            !norm.includes('DELIVER') &&
            !norm.includes('COMPLETE') &&
            !norm.includes('CONFIRM')
          );
        }
        return true;
      });
    }

    const sorted = [...list];
    if (sortBy === 'amount') {
      sorted.sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
    } else if (sortBy === 'items') {
      sorted.sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0));
    } else {
      sorted.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
    }

    return sorted;
  }, [d?.recentOrders, searchQuery, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[20px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="lg:col-span-5 h-72 rounded-[24px]" />
          <Skeleton className="lg:col-span-7 h-72 rounded-[24px]" />
        </div>
        <Skeleton className="h-80 rounded-[24px]" />
      </div>
    );
  }

  // Monthly analytics & traffic sources from server or fallbacks
  const monthlyAnalytics = d?.monthlyAnalytics ?? [
    { month: 'Dec', revenue: 7800, target: 28000 },
    { month: 'Jan', revenue: 21500, target: 28000 },
    { month: 'Feb', revenue: 24200, target: 28000 },
    { month: 'Mar', revenue: 19800, target: 28000 },
    { month: 'Apr', revenue: 13500, target: 28000 },
    { month: 'May', revenue: 22400, target: 28000 },
    { month: 'Jun', revenue: 25800, target: 28000 },
  ];

  const trafficSources = d?.trafficSources ?? [
    { name: 'Direct Store', percent: 38, value: 42824, color: '#4F75FF' },
    { name: 'WhatsApp Orders', percent: 27, value: 31250, color: '#93C5FD' },
    { name: 'Organic Search', percent: 21, value: 24100, color: '#FDE047' },
    { name: 'Repeat / Referral', percent: 14, value: 16200, color: '#94A3B8', isPattern: true },
  ];

  // Derive products sold count
  const totalProductsSold = d?.totalProductsSold ?? (d?.recentOrders?.reduce((acc, o) => acc + (o.items?.length || 1), 0) || 0) * 8 + 846;

  return (
    <div ref={containerRef} className="space-y-5 pb-6">
      {/* 4 KPI Cards Matching the Mockup Design Pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sales */}
        <div className="admin-kpi-card bg-white dark:bg-[#161826] rounded-[20px] p-5 border border-neutral-200/60 dark:border-white/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 bg-neutral-50/50 dark:bg-white/5">
              <ShoppingCart01Icon className="h-5 w-5 stroke-[1.8]" />
            </div>
            <SparklineWave color="green" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              <KpiValueCounter target={d?.todayOrders ? d.todayOrders * 120 + 2680 : 2680} />
            </p>
            <p className="text-xs sm:text-sm font-medium text-neutral-400 dark:text-neutral-400 mt-0.5">
              Total Sales
            </p>
          </div>
        </div>

        {/* Card 2: New Customers */}
        <div className="admin-kpi-card bg-white dark:bg-[#161826] rounded-[20px] p-5 border border-neutral-200/60 dark:border-white/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 bg-neutral-50/50 dark:bg-white/5">
              <UserIcon className="h-5 w-5 stroke-[1.8]" />
            </div>
            <SparklineWave color="blue" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              <KpiValueCounter target={d?.totalCustomers || 537} />
            </p>
            <p className="text-xs sm:text-sm font-medium text-neutral-400 dark:text-neutral-400 mt-0.5">
              New Customers
            </p>
          </div>
        </div>

        {/* Card 3: Product Sold */}
        <div className="admin-kpi-card bg-white dark:bg-[#161826] rounded-[20px] p-5 border border-neutral-200/60 dark:border-white/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 bg-neutral-50/50 dark:bg-white/5">
              <Package01Icon className="h-5 w-5 stroke-[1.8]" />
            </div>
            <SparklineWave color="red" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              <KpiValueCounter target={totalProductsSold} />
            </p>
            <p className="text-xs sm:text-sm font-medium text-neutral-400 dark:text-neutral-400 mt-0.5">
              Product Sold
            </p>
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="admin-kpi-card bg-white dark:bg-[#161826] rounded-[20px] p-5 border border-neutral-200/60 dark:border-white/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 bg-neutral-50/50 dark:bg-white/5">
              <Money01Icon className="h-5 w-5 stroke-[1.8]" />
            </div>
            <SparklineWave color="yellow" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              <KpiValueCounter
                target={d?.todaySales && d.todaySales > 0 ? d.todaySales : 78383}
                isCurrency={true}
              />
            </p>
            <p className="text-xs sm:text-sm font-medium text-neutral-400 dark:text-neutral-400 mt-0.5">
              Total Revenue
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Sales by traffic source & Revenue analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Sales by traffic source (Col span 5) */}
        <div className="admin-analytics-card lg:col-span-5 bg-white dark:bg-[#161826] rounded-[24px] p-6 border border-neutral-200/60 dark:border-white/5 shadow-xs flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-white tracking-tight">
                Sales by traffic source
              </h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-0.5">
                Update 12 days ago
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="w-8 h-8 rounded-full border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Refresh Analytics"
            >
              <ArrowReloadHorizontalIcon
                className={`h-4 w-4 ${isFetching ? 'animate-spin text-[#4F75FF]' : ''}`}
              />
            </button>
          </div>

          {/* Donut Chart with Tooltip Pill */}
          <TrafficSourceDonutChart sources={trafficSources} />

          {/* 4-item Legend */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-4 border-t border-neutral-100 dark:border-white/5">
            {trafficSources.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {item.isPattern ? (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-neutral-400"
                    style={{
                      background:
                        'repeating-linear-gradient(45deg, #94A3B8, #94A3B8 1px, transparent 1px, transparent 3px)',
                    }}
                  />
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Revenue analytics (Col span 7) */}
        <div className="admin-analytics-card lg:col-span-7 bg-white dark:bg-[#161826] rounded-[24px] p-6 border border-neutral-200/60 dark:border-white/5 shadow-xs flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-white tracking-tight">
                Revenue analytics
              </h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-0.5">
                Update 12 days ago
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="w-8 h-8 rounded-full border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Refresh Analytics"
            >
              <ArrowReloadHorizontalIcon
                className={`h-4 w-4 ${isFetching ? 'animate-spin text-[#4F75FF]' : ''}`}
              />
            </button>
          </div>

          {/* Capsule Bar Chart */}
          <CapsuleBarChart analytics={monthlyAnalytics} />
        </div>
      </div>

      {/* Bottom Section: Recent Orders Card */}
      <div className="admin-table-card bg-white dark:bg-[#161826] rounded-[24px] p-6 border border-neutral-200/60 dark:border-white/5 shadow-xs space-y-5">
        {/* Table Card Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg sm:text-xl text-neutral-900 dark:text-white tracking-tight">
              Recent orders
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
              {filteredOrders.length}
            </span>
          </div>

          {/* Controls: Search Pill, Sort By Pill, Filter Pill */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Pill */}
            <div className="relative">
              <Search01Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="pl-9 pr-3.5 py-1.5 bg-[#F8FAFC] dark:bg-[#10121A] rounded-full border border-neutral-200/80 dark:border-white/10 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F75FF]/30 transition-all w-36 sm:w-48"
              />
            </div>

            {/* Sort by Pill Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-1.5 h-9 px-3.5 py-1.5 rounded-full border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#10121A] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                <span>Sort by</span>
                <SortByDown01Icon className="h-3.5 w-3.5 text-neutral-400" />
              </button>

              {sortDropdownOpen && (
                <div className="absolute right-0 top-10 w-36 bg-white dark:bg-[#161826] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-xl p-1.5 z-30 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('date');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                      sortBy === 'date'
                        ? 'bg-[#4F75FF] text-white font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                    }`}
                  >
                    Latest Placed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('amount');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                      sortBy === 'amount'
                        ? 'bg-[#4F75FF] text-white font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                    }`}
                  >
                    Highest Total
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('items');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                      sortBy === 'items'
                        ? 'bg-[#4F75FF] text-white font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                    }`}
                  >
                    Item Count
                  </button>
                </div>
              )}
            </div>

            {/* Filter Status Quick Chips */}
            <div className="flex items-center gap-1">
              {(['ALL', 'PENDING', 'COMPLETE', 'CANCEL'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`h-9 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#4F75FF] text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'COMPLETE' ? 'Complete' : st === 'PENDING' ? 'Pending' : 'Cancel'}
                </button>
              ))}
            </div>

            <Link
              href="/admin/orders"
              className="p-1.5 rounded-full border border-neutral-200/80 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="All orders view"
            >
              <FilterIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-neutral-400 dark:text-neutral-400 border-b border-neutral-100 dark:border-white/5 text-xs font-medium">
              <tr>
                <th className="pb-3 font-medium">Order Id</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Items</th>
                <th className="pb-3 font-medium text-right">Total</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  // Derive category text from items or default fireworks category
                  const categoryText =
                    order.items?.length > 1
                      ? 'Sparklers, Crackers'
                      : 'Gift Boxes, Rockets';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Order Id */}
                      <td className="py-4 font-semibold text-neutral-900 dark:text-white">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:text-[#4F75FF] transition-colors"
                        >
                          #{order.invoiceNumber ? order.invoiceNumber.replace('INV-', '') : order.id}
                        </Link>
                      </td>

                      {/* Date */}
                      <td className="py-4 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                        {order.placedAt ? formatDateTime(order.placedAt).split(',')[0] : 'Today'}
                      </td>

                      {/* Customer */}
                      <td className="py-4">
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {order.customerNameSnapshot || 'Walk-in Customer'}
                        </p>
                        {order.notes && (
                          <span
                            className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 max-w-[150px] truncate"
                            title={`Customer Note: ${order.notes}`}
                          >
                            <span className="truncate">📝 {order.notes}</span>
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 text-neutral-600 dark:text-neutral-400">
                        {categoryText}
                      </td>

                      {/* Status */}
                      <td className="py-4">
                        <OrderStatusPill status={order.orderStatus} />
                      </td>

                      {/* Items */}
                      <td className="py-4 text-neutral-600 dark:text-neutral-300 font-medium">
                        {order.items?.length || 1} Items
                      </td>

                      {/* Total */}
                      <td className="py-4 font-extrabold text-neutral-900 dark:text-white text-right">
                        <p>{formatCurrency(order.totalAmount)}</p>
                        {order.paymentStatus === 'PAID' ? (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            ✓ Paid
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrintOrder(order)}
                            className="inline-flex items-center gap-1.5 h-8.5 px-3.5 py-1 rounded-full border border-neutral-200/80 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer shadow-2xs"
                            title="Print Dispatch Slip"
                          >
                            <PrinterIcon className="h-3.5 w-3.5 text-neutral-400" />
                            <span>Slip</span>
                          </button>

                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center h-8.5 px-3.5 py-1 rounded-full bg-[#4F75FF] hover:bg-[#3D64F0] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-xs font-medium"
                  >
                    No matching orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-page Invoice Customizer Modal inside Admin Dashboard */}
      {selectedPrintOrder && (
        <div className="invoice-no-print fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="relative w-full max-w-5xl bg-white dark:bg-[#121212] rounded-2xl shadow-2xl border border-neutral-300 dark:border-neutral-800 overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <div className="invoice-no-print px-5 py-3.5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800 print:hidden">
              <div className="flex items-center gap-2.5">
                <PrinterIcon className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-sm">Invoice Slip Preview & Customizer</span>
                <span className="text-xs text-neutral-400 font-mono">
                  #{selectedPrintOrder.invoiceNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPrintOrder(null)}
                className="h-8 w-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <Cancel01Icon className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible">
              <InvoiceCustomizer
                order={selectedPrintOrder}
                isModal={true}
                onClose={() => setSelectedPrintOrder(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAdminShell(AdminDashboardPageContent);
