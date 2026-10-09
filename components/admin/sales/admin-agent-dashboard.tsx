'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  ShoppingCart,
  Truck,
  XCircle,
  Trophy,
  ArrowUpRight,
  Download,
  Calendar,
  Clock,
  RefreshCw,
  Target,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import Link from '@/components/ui/link';
import { withAdminShell } from '@/components/admin/admin-shell';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  CONFIRMED: '#6366f1',
  ASSIGNED: '#8b5cf6',
  OUT_FOR_DELIVERY: '#f59e0b',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

function AdminAgentDashboardContent() {
  const [datePreset, setDatePreset] = useState('last30days');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'sales', 'tracking', { datePreset, dateFrom, dateTo }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('datePreset', datePreset);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/sales/tracking?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load tracking dashboard');
      return res.json();
    },
  });

  const metrics = data?.metrics || {
    totalAgents: 0,
    activeAgents: 0,
    totalAttributedOrders: 0,
    totalAttributedOrderValue: 0,
    totalDeliveredOrders: 0,
    totalDeliveredOrderValue: 0,
    cancelledOrders: 0,
    topAgent: null,
  };

  const charts = data?.charts || {
    ordersOverTime: [],
    valueByAgent: [],
    agentPerformanceComparison: [],
    orderStatusDistribution: [],
  };

  const handleDownloadReport = () => {
    const params = new URLSearchParams();
    params.set('type', 'reports');
    params.set('datePreset', datePreset);
    window.location.href = `/api/admin/sales/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Top Header & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Target className="h-4 w-4 text-brand" />
            <span>Sales Management & Attribution</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            Agent Order Tracking Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time attribution, team performance metrics, and sales intelligence.
          </p>
        </div>

        {/* Action Controls & Date Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs">
            <button
              onClick={() => {
                setDatePreset('today');
                setDateFrom('');
                setDateTo('');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                datePreset === 'today'
                  ? 'bg-brand text-brand-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setDatePreset('last7days');
                setDateFrom('');
                setDateTo('');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                datePreset === 'last7days'
                  ? 'bg-brand text-brand-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => {
                setDatePreset('last30days');
                setDateFrom('');
                setDateTo('');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                datePreset === 'last30days'
                  ? 'bg-brand text-brand-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => {
                setDatePreset('thisMonth');
                setDateFrom('');
                setDateTo('');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                datePreset === 'thisMonth'
                  ? 'bg-brand text-brand-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => {
                setDatePreset('all');
                setDateFrom('');
                setDateTo('');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                datePreset === 'all'
                  ? 'bg-brand text-brand-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-brand' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="h-9 px-3.5 rounded-xl bg-brand text-brand-foreground hover:brightness-105 flex items-center gap-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total & Active Agents */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Sales Agents
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {metrics.totalAgents}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <UserCheck className="h-3 w-3" />
                {metrics.activeAgents} Active
              </span>
              <span>•</span>
              <span>{metrics.totalAgents - metrics.activeAgents} Inactive</span>
            </div>
          </div>
          <div className="pt-2 border-t border-border/60">
            <Link
              href="/admin/sales/agents"
              className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>Manage agent roster</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Total Attributed Orders */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Attributed Orders
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {metrics.totalAttributedOrders}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Gross Value: <span className="font-bold text-foreground font-mono">{formatCurrency(metrics.totalAttributedOrderValue)}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              {metrics.newOrders} New • {metrics.processingOrders} Processing
            </span>
          </div>
        </div>

        {/* Card 3: Delivered Sales Value */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Delivered Sales
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Truck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(metrics.totalDeliveredOrderValue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Delivered Orders: <span className="font-bold text-foreground font-mono">{metrics.totalDeliveredOrders}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              Excludes cancelled & unfulfilled orders
            </span>
          </div>
        </div>

        {/* Card 4: Top Performing Agent */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Top Agent
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="h-4.5 w-4.5" />
            </div>
          </div>
          {metrics.topAgent ? (
            <div>
              <div className="text-lg font-bold text-foreground truncate">
                {metrics.topAgent.agentName}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                  {metrics.topAgent.referralCode}
                </span>
                <span>•</span>
                <span className="font-mono">{metrics.topAgent.totalOrders} Orders</span>
              </div>
              <div className="pt-2 mt-2 border-t border-border/60">
                <span className="text-xs font-semibold text-foreground font-mono">
                  {formatCurrency(metrics.topAgent.deliveredValue || metrics.topAgent.totalValue)} sales
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium text-muted-foreground">No orders in period</div>
              <p className="text-xs text-muted-foreground mt-1">Attribution will register automatically</p>
            </div>
          )}
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Orders Generated Over Time (Area Chart) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-foreground">Attributed Orders Over Time</h2>
              <p className="text-xs text-muted-foreground">Daily volume of orders referred by sales agents</p>
            </div>
            <div className="text-xs font-mono font-semibold text-muted-foreground">
              Total: {metrics.totalAttributedOrders} orders
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            {charts.ordersOverTime && charts.ordersOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.ordersOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="orderCountGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e24000" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#e24000" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [
                      name === 'orderValue' ? formatCurrency(val) : `${val} orders`,
                      name === 'orderValue' ? 'Sales Value' : 'Orders',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="orderCount"
                    stroke="#e24000"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#orderCountGrad)"
                    name="orderCount"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm font-semibold">No order timeline data for this date range</p>
                <p className="text-xs">Orders placed with agent referral links will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Order Status Distribution (Donut Chart) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <div>
            <h2 className="font-bold text-base text-foreground">Status Breakdown</h2>
            <p className="text-xs text-muted-foreground">Fulfillment states of attributed orders</p>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center">
            {charts.orderStatusDistribution && charts.orderStatusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.orderStatusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {charts.orderStatusDistribution.map((entry: any) => (
                      <Cell
                        key={`cell-${entry.status}`}
                        fill={STATUS_COLORS[entry.status] || '#71717a'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} orders`, 'Count']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-muted-foreground font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <p className="text-sm font-semibold">No orders in period</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Order Value by Agent (Bar Chart) */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-foreground">Sales Value by Agent</h2>
              <p className="text-xs text-muted-foreground">Comparison of total vs delivered revenue</p>
            </div>
            <Link
              href="/admin/sales/reports"
              className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>Full Leaderboard</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-[280px] w-full pt-2">
            {charts.valueByAgent && charts.valueByAgent.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.valueByAgent} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="agentName"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [
                      formatCurrency(val),
                      name === 'deliveredValue' ? 'Delivered Sales' : 'Total Attributed',
                    ]}
                  />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="totalValue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total Value" />
                  <Bar dataKey="deliveredValue" fill="#10b981" radius={[4, 4, 0, 0]} name="Delivered Value" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6 text-muted-foreground">
                <p className="text-sm font-semibold">No agent sales comparison data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Agent Performance Volume (Delivered vs Processing vs Cancelled) */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-foreground">Agent Order Outcomes</h2>
              <p className="text-xs text-muted-foreground">Delivered, in-progress, and cancelled order volumes</p>
            </div>
            <Link
              href="/admin/sales/agents"
              className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
            >
              <span>View All Agents</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-[280px] w-full pt-2">
            {charts.agentPerformanceComparison && charts.agentPerformanceComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.agentPerformanceComparison} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="agentName"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="delivered" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} name="Delivered" />
                  <Bar dataKey="processing" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} name="Processing" />
                  <Bar dataKey="cancelled" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} name="Cancelled" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6 text-muted-foreground">
                <p className="text-sm font-semibold">No order outcomes data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAdminShell(AdminAgentDashboardContent);
