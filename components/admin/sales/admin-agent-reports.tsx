'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Download,
  Filter,
  Search,
  ArrowUpDown,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { withAdminShell } from '@/components/admin/admin-shell';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

interface LeaderboardAgent {
  rank: number;
  agentId: number;
  agentCode: string;
  name: string;
  referralCode: string;
  mobile: string;
  location: string | null;
  isActive: boolean;
  joiningDate: string | null;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalAttributedValue: number;
  deliveredSalesValue: number;
  averageOrderValue: number;
}

function AdminAgentReportsContent() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<string>('all');
  const [rankBy, setRankBy] = useState<'delivered_value' | 'total_value' | 'delivered_orders' | 'total_orders'>('delivered_value');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        rankBy,
        datePreset,
      });
      const res = await fetch(`/api/admin/sales/reports?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load reports: ${res.statusText}`);
      }
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [datePreset, rankBy]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams({
        type: 'leaderboard',
        rankBy,
        datePreset,
      });
      window.location.href = `/api/admin/sales/export?${params.toString()}`;
    } catch (err: any) {
      console.error('Export failed', err);
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const filteredAgents = leaderboard.filter((agent) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.agentCode.toLowerCase().includes(q) ||
      agent.referralCode.toLowerCase().includes(q) ||
      (agent.location && agent.location.toLowerCase().includes(q))
    );
  });

  // Calculate totals for summary cards
  const totalAttributedSales = leaderboard.reduce((acc, a) => acc + (a.totalAttributedValue || 0), 0);
  const totalDeliveredSales = leaderboard.reduce((acc, a) => acc + (a.deliveredSalesValue || 0), 0);
  const totalOrdersCount = leaderboard.reduce((acc, a) => acc + (a.totalOrders || 0), 0);
  const totalDeliveredCount = leaderboard.reduce((acc, a) => acc + (a.deliveredOrders || 0), 0);
  const overallAOV = totalOrdersCount > 0 ? totalAttributedSales / totalOrdersCount : 0;

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Agent Performance Reports & Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rank sales agents by actual order attribution and delivered revenue metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || leaderboard.length === 0}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card rounded-xl border p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Date Range:
              </span>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                aria-label="Filter by date range"
                className="h-9 px-3 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Rank By:
              </span>
              <select
                value={rankBy}
                onChange={(e) => setRankBy(e.target.value as any)}
                aria-label="Rank sales agents by metric"
                className="h-9 px-3 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground font-medium"
              >
                <option value="delivered_value">Delivered Revenue (INR)</option>
                <option value="total_value">Total Attributed Value</option>
                <option value="delivered_orders">Delivered Orders Count</option>
                <option value="total_orders">Total Orders Count</option>
              </select>
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search agent name, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4 shadow-xs border-l-4 border-l-primary">
          <div className="text-xs font-medium text-muted-foreground">Total Participating Agents</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{leaderboard.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {leaderboard.filter((a) => a.isActive).length} currently active
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-xs border-l-4 border-l-emerald-500">
          <div className="text-xs font-medium text-muted-foreground">Delivered Revenue</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalDeliveredSales)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {totalDeliveredCount} delivered orders
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-xs border-l-4 border-l-blue-500">
          <div className="text-xs font-medium text-muted-foreground">Gross Attributed Revenue</div>
          <div className="text-2xl font-bold mt-1 text-foreground">
            {formatCurrency(totalAttributedSales)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {totalOrdersCount} total attributed orders
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-xs border-l-4 border-l-amber-500">
          <div className="text-xs font-medium text-muted-foreground">Average Order Value (AOV)</div>
          <div className="text-2xl font-bold mt-1 text-foreground">
            {formatCurrency(overallAOV)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Across all agent attributed orders
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {!loading && top3.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-semibold text-foreground">Top Performing Sales Agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((agent, index) => {
              const badgeColors = [
                'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700',
                'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
                'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-700',
              ];
              const placeLabels = ['1st Place (Gold)', '2nd Place (Silver)', '3rd Place (Bronze)'];
              const placeIcons = [Trophy, Medal, Award];
              const IconComp = placeIcons[index];

              return (
                <div
                  key={agent.agentId}
                  className={`relative overflow-hidden rounded-xl border p-5 shadow-xs flex flex-col justify-between ${
                    index === 0
                      ? 'border-amber-400 dark:border-amber-600 bg-amber-500/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeColors[index]} flex items-center gap-1`}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                        {placeLabels[index]}
                      </span>
                      <StatusBadge status={agent.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        <a
                          href={`/admin/sales/agents/${agent.agentId}`}
                          className="hover:underline text-primary"
                        >
                          {agent.name}
                        </a>
                      </h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="font-mono">{agent.agentCode}</span>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(agent.referralCode)}
                          className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] hover:bg-muted/80 flex items-center gap-1 font-semibold text-primary"
                          title="Copy Referral Code"
                        >
                          {agent.referralCode}
                          {copiedCode === agent.referralCode ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-lg border text-xs">
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase font-semibold">
                          Delivered Revenue
                        </div>
                        <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {formatCurrency(agent.deliveredSalesValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase font-semibold">
                          Attributed Orders
                        </div>
                        <div className="font-bold text-sm text-foreground mt-0.5">
                          {agent.totalOrders}
                        </div>
                      </div>
                      <div className="mt-1">
                        <div className="text-muted-foreground text-[10px] uppercase font-semibold">
                          Delivered Orders
                        </div>
                        <div className="font-semibold text-foreground mt-0.5">
                          {agent.deliveredOrders}
                        </div>
                      </div>
                      <div className="mt-1">
                        <div className="text-muted-foreground text-[10px] uppercase font-semibold">
                          Avg Order Value
                        </div>
                        <div className="font-semibold text-foreground mt-0.5">
                          {formatCurrency(agent.averageOrderValue)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 gap-1.5"
                      asChild
                    >
                      <a href={`/admin/sales/agents/${agent.agentId}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Agent Full Profile
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">Complete Agent Rankings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Performance ordered by {rankBy.replace('_', ' ')}
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Showing {filteredAgents.length} of {leaderboard.length} agents
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="py-3 px-3 text-center w-12">Rank</th>
                <th className="py-3 px-3">Agent</th>
                <th className="py-3 px-3">Referral Code</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Total Orders</th>
                <th className="py-3 px-3 text-right">Delivered</th>
                <th className="py-3 px-3 text-right">Cancelled</th>
                <th className="py-3 px-3 text-right">Avg Order Value</th>
                <th className="py-3 px-3 text-right">Attributed Value</th>
                <th className="py-3 px-3 text-right font-bold text-foreground">Delivered Sales</th>
                <th className="py-3 px-3 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={12} className="py-6 text-center text-xs text-muted-foreground">
                      Loading rankings...
                    </td>
                  </tr>
                ))
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-sm text-muted-foreground">
                    No sales agents found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold">
                      {agent.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 font-bold text-xs">
                          1
                        </span>
                      ) : agent.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/20 text-slate-600 font-bold text-xs">
                          2
                        </span>
                      ) : agent.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 font-bold text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">{agent.rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-foreground text-xs">
                        <a
                          href={`/admin/sales/agents/${agent.agentId}`}
                          className="hover:underline text-primary"
                        >
                          {agent.name}
                        </a>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {agent.agentCode}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(agent.referralCode)}
                        className="font-mono bg-muted px-2 py-0.5 rounded text-xs hover:bg-muted/80 flex items-center gap-1 font-semibold text-foreground"
                        title="Click to copy code"
                      >
                        {agent.referralCode}
                        {copiedCode === agent.referralCode ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">
                      {agent.location || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={agent.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-medium">
                      {agent.totalOrders}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {agent.deliveredOrders}
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-muted-foreground">
                      {agent.cancelledOrders}
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-muted-foreground font-mono">
                      {formatCurrency(agent.averageOrderValue)}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-mono font-medium">
                      {formatCurrency(agent.totalAttributedValue)}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(agent.deliveredSalesValue)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        asChild
                        title="View Agent Profile"
                      >
                        <a href={`/admin/sales/agents/${agent.agentId}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withAdminShell(AdminAgentReportsContent);
