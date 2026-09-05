'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/admin/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import {
  Users,
  Search,
  ArrowUpRight,
  Download,
  Award,
  Repeat,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CustomerListItem {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<'all' | 'repeat' | 'vip'>('all');
  const [sortBy, setSortBy] = useState('spent_desc');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'customers', 'list', { page, limit: pageSize, search, segment, sortBy }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (search) params.set('search', search);
      if (segment !== 'all') params.set('segment', segment);
      if (sortBy) params.set('sortBy', sortBy);

      return fetch(`/api/admin/customers?${params}`).then((r) => r.json());
    },
  });

  const customers: CustomerListItem[] = data?.customers || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 25 };
  const stats = data?.stats || { total: 0, repeat: 0, vip: 0 };

  // Export Customer Contacts to CSV
  const handleExportCSV = () => {
    if (customers.length === 0) {
      toast.error('No customers to export');
      return;
    }

    const headers = [
      'Customer ID',
      'Customer Name',
      'Mobile Number',
      'Email Address',
      'Total Orders Placed',
      'Lifetime Spend (INR)',
      'Last Placed Order Date',
    ];

    const rows = customers.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.mobile}"`,
      `"${c.email || ''}"`,
      c.totalOrders,
      c.totalSpent.toFixed(2),
      `"${c.lastOrderAt ? new Date(c.lastOrderAt).toISOString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `customers_contacts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${customers.length} customer contacts`);
  };

  const segmentTabs = [
    { key: 'all' as const, label: 'All Customers', count: stats.total, icon: Users },
    { key: 'repeat' as const, label: 'Repeat Buyers (2+ Orders)', count: stats.repeat, icon: Repeat },
    { key: 'vip' as const, label: 'VIP Spenders (> ₹5,000)', count: stats.vip, icon: Award },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Customers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registered firework buyers, repeat customer history, and lifetime customer spend.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            className="text-xs font-semibold"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-1 text-muted-foreground" /> Export Contacts CSV
          </Button>
        </div>
      </div>

      {/* Segment Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
        {segmentTabs.map((tab) => {
          const isActive = segment === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setSegment(tab.key);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:bg-muted/40'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive
                    ? 'bg-background/20 text-background'
                    : 'bg-muted text-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-2xl bg-card border border-border">
        <div className="relative sm:col-span-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customer name, mobile, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-muted/30 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
          >
            <option value="spent_desc">Highest Lifetime Spend</option>
            <option value="spent_asc">Lowest Lifetime Spend</option>
            <option value="orders_desc">Most Orders Placed</option>
            <option value="recent_desc">Most Recent Order</option>
            <option value="name_asc">Customer Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : customers.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Mobile Number</th>
                  <th className="px-5 py-3.5">Buyer Tier</th>
                  <th className="px-5 py-3.5">Total Orders</th>
                  <th className="px-5 py-3.5">Lifetime Spend</th>
                  <th className="px-5 py-3.5">Last Order</th>
                  <th className="px-5 py-3.5 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c: CustomerListItem) => {
                  const isVip = c.totalSpent >= 5000;
                  const isRepeat = c.totalOrders >= 2;

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-foreground">{c.name}</p>
                        {c.email && (
                          <p className="text-[11px] text-muted-foreground">{c.email}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-medium text-foreground">
                        {c.mobile}
                      </td>
                      <td className="px-5 py-3.5">
                        {isVip ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            <Sparkles className="h-3 w-3 text-amber-600" /> VIP Spender
                          </span>
                        ) : isRepeat ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                            <Repeat className="h-3 w-3 text-blue-600" /> Repeat Buyer
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Standard</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-foreground font-semibold">
                        {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-foreground font-mono">
                        {formatCurrency(c.totalSpent)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {c.lastOrderAt ? formatDateTime(c.lastOrderAt) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                        >
                          View <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-card border-t border-border">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
              itemLabel="customers"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-8 space-y-2">
          <Users className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-semibold text-foreground">No customer records found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search query or customer segment tabs.
          </p>
        </div>
      )}
    </div>
  );
}
