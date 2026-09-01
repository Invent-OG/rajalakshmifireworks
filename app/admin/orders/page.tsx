'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { useState } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { Search, ChevronLeft, ChevronRight, Truck, Store, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminOrderListItem {
  id: number;
  invoiceNumber: string;
  customerNameSnapshot: string;
  customerMobileSnapshot: string;
  items?: Array<{ id: number }>;
  totalAmount: string | number;
  fulfillmentType: string;
  orderStatus: string;
  placedAt: string;
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fulfillment, setFulfillment] = useState('');

  const filters = {
    page,
    search: search || undefined,
    status: status || undefined,
    fulfillment: fulfillment || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.orders.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (fulfillment) params.set('fulfillment', fulfillment);
      return fetch(`/api/admin/orders?${params}`).then((r) => r.json());
    },
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View, filter, and progress all customer firework order consignments.
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground self-start sm:self-auto">
          {pagination.total} orders total
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card border border-border">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by invoice, customer, mobile..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-muted/30 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="READY">Ready</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={fulfillment}
          onChange={(e) => {
            setFulfillment(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
        >
          <option value="">All Fulfillment</option>
          <option value="DELIVERY">Doorstep Delivery</option>
          <option value="PICKUP">Store Pickup</option>
        </select>
      </div>

      {/* Orders Table Container */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3 text-right">Total Amount</th>
                  <th className="px-5 py-3">Fulfillment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order: AdminOrderListItem) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-foreground">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="hover:underline"
                      >
                        {order.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground">{order.customerNameSnapshot}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {order.customerMobileSnapshot}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {order.items?.length ?? 0} items
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground text-right">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-foreground">
                        {order.fulfillmentType === 'DELIVERY' ? (
                          <>
                            <Truck className="h-3 w-3 text-muted-foreground" /> Delivery
                          </>
                        ) : (
                          <>
                            <Store className="h-3 w-3 text-muted-foreground" /> Pickup
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(order.placedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                      >
                        Inspect <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
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
          <p className="text-sm font-semibold text-foreground">No matching orders found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search criteria or filter tags.
          </p>
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-medium text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total orders)
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
