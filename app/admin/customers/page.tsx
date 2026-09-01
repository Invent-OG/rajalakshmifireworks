'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { Users, Search, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface CustomerListItem {
  id: number;
  name: string;
  mobile: string;
  totalOrders: number;
  totalSpent: string | number;
  lastOrderAt: string | null;
}

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'customers', 'list', { page, search }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      return fetch(`/api/admin/customers?${params}`).then((r) => r.json());
    },
  });

  const customers = data?.customers || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Customers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registered firework buyers, repeat customer history, and lifetime spend.
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground self-start sm:self-auto">
          {pagination.total} customers total
        </div>
      </div>

      {/* Search toolbar */}
      <div className="p-3 rounded-xl bg-card border border-border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customer name or mobile..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-muted/30 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all"
          />
        </div>
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : customers.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Customer Name</th>
                  <th className="px-5 py-3">Mobile Number</th>
                  <th className="px-5 py-3">Total Orders</th>
                  <th className="px-5 py-3">Lifetime Spend</th>
                  <th className="px-5 py-3">Last Placed</th>
                  <th className="px-5 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c: CustomerListItem) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{c.name}</td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground">{c.mobile}</td>
                    <td className="px-5 py-3.5 text-foreground font-medium">
                      {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {c.lastOrderAt ? formatDateTime(c.lastOrderAt) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                      >
                        Profile <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-8">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-semibold text-foreground">No customer records found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-medium text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
