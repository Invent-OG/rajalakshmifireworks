'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/admin/pagination';
import { BulkActionsBar } from '@/components/admin/bulk-actions-bar';
import { Portal } from '@/components/ui/portal';
import { Select, Textarea } from '@/components/ui/input';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { ORDER_STATUS_LABELS } from '@/lib/constants/order-status';
import {
  Search,
  Truck,
  Store,
  ArrowUpRight,
  Download,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Printer,
  X,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import Link from '@/components/ui/link';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { OrderStatus } from '@/db/schema';
import { InvoiceCustomizer } from '@/components/admin/invoice-customizer';

interface AdminOrderListItem {
  id: number;
  invoiceNumber: string;
  customerNameSnapshot: string;
  customerMobileSnapshot: string;
  items?: Array<{ id: number; productNameSnapshot?: string; quantity?: number }>;
  subtotal?: string | number;
  deliveryCharge?: string | number;
  totalAmount: string | number;
  fulfillmentType: string;
  orderStatus: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;
  placedAt: string;
  notes?: string | null;
}

import { withAdminShell } from './admin-shell';

function AdminOrdersPageContent() {
  const queryClient = useQueryClient();
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<any | null>(null);

  // Filters and Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [fulfillment, setFulfillment] = useState('ALL');
  const [datePreset, setDatePreset] = useState('all');
  const [sortBy, setSortBy] = useState('placedAt_desc');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<OrderStatus>('CONFIRMED');
  const [bulkNote, setBulkNote] = useState('');

  const filters = {
    page,
    limit: pageSize,
    search: search || undefined,
    status: status !== 'ALL' ? status : undefined,
    paymentStatus: paymentStatus !== 'ALL' ? paymentStatus : undefined,
    fulfillment: fulfillment !== 'ALL' ? fulfillment : undefined,
    datePreset: datePreset !== 'all' ? datePreset : undefined,
    sortBy,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', 'list', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (search) params.set('search', search);
      if (status && status !== 'ALL') params.set('status', status);
      if (paymentStatus && paymentStatus !== 'ALL') params.set('paymentStatus', paymentStatus);
      if (fulfillment && fulfillment !== 'ALL') params.set('fulfillment', fulfillment);
      if (datePreset && datePreset !== 'all') params.set('datePreset', datePreset);
      if (sortBy) params.set('sortBy', sortBy);

      return fetch(`/api/admin/orders?${params}`).then((r) => r.json());
    },
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const orders: AdminOrderListItem[] = data?.orders ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0, limit: 25 };
  const statusCounts = data?.statusCounts ?? {};


  // Bulk Status Update Mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedIds,
          newStatus: bulkTargetStatus,
          note: bulkNote || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Bulk update failed');
      return json;
    },
    onSuccess: (res) => {
      toast.success(
        `Successfully updated ${res.updatedCount} order${res.updatedCount === 1 ? '' : 's'}`
      );
      if (res.skippedIds?.length > 0) {
        toast.info(`${res.skippedIds.length} orders were skipped (incompatible status transition)`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setSelectedIds([]);
      setBulkStatusModalOpen(false);
      setBulkNote('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Toggle Single Order Selection
  const toggleSelectOrder = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select All on Current Page
  const handleSelectAllOnPage = () => {
    const pageIds = orders.map((o) => o.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Export Orders to CSV
  const handleExportCSV = () => {
    const targetOrders =
      selectedIds.length > 0
        ? orders.filter((o) => selectedIds.includes(o.id))
        : orders;

    if (targetOrders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const headers = [
      'Invoice Number',
      'Customer Name',
      'Customer Mobile',
      'Item Count',
      'Total Amount (INR)',
      'Fulfillment Type',
      'Order Status',
      'Date Placed',
    ];

    const rows = targetOrders.map((o) => [
      `"${o.invoiceNumber}"`,
      `"${o.customerNameSnapshot.replace(/"/g, '""')}"`,
      `"${o.customerMobileSnapshot}"`,
      o.items?.length ?? 0,
      o.totalAmount,
      `"${o.fulfillmentType}"`,
      `"${o.orderStatus}"`,
      `"${new Date(o.placedAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `orders_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${targetOrders.length} orders to CSV`);
  };

  const statusTabList: Array<{ key: string; label: string }> = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'NEW', label: 'New' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground">
            View, filter, bulk manage, and progress customer firework bookings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            className="text-xs font-semibold cursor-pointer"
            onClick={() => {
              const demo = {
                id: 0,
                invoiceNumber: '01234',
                customerNameSnapshot: 'Helene Paquet',
                customerMobileSnapshot: '9842100001',
                orderStatus: 'CONFIRMED',
                placedAt: new Date().toISOString(),
                addressSnapshot: {
                  address: '123 Anywhere St., Sivakasi Depot',
                  city: 'Sivakasi',
                  pincode: '626123',
                },
                subtotal: '900.00',
                discountAmount: '0.00',
                deliveryCharge: '0.00',
                totalAmount: '990.00',
                finalAmount: '990.00',
                items: [
                  {
                    id: 1,
                    productNameSnapshot: 'Social Media Strategy Plan',
                    quantity: 1,
                    sellingPriceSnapshot: '100.00',
                    lineTotal: '100.00',
                  },
                  {
                    id: 2,
                    productNameSnapshot: 'Content Creation (5 posts)',
                    quantity: 5,
                    sellingPriceSnapshot: '100.00',
                    lineTotal: '500.00',
                  },
                  {
                    id: 3,
                    productNameSnapshot: 'Scheduling & Reporting',
                    quantity: 1,
                    sellingPriceSnapshot: '100.00',
                    lineTotal: '100.00',
                  },
                  {
                    id: 4,
                    productNameSnapshot: 'Instagram Story Design (3 slides)',
                    quantity: 3,
                    sellingPriceSnapshot: '50.00',
                    lineTotal: '150.00',
                  },
                  {
                    id: 5,
                    productNameSnapshot: 'Hashtag Research',
                    quantity: 1,
                    sellingPriceSnapshot: '50.00',
                    lineTotal: '50.00',
                  },
                ],
              };
              setSelectedPrintOrder(orders[0] || demo);
            }}
          >
            <FileText className="h-4 w-4 mr-1 text-muted-foreground" /> Invoice Template Editor
          </Button>
          <Button
            variant="outline"
            size="md"
            className="text-xs font-semibold"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-1 text-muted-foreground" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
        {statusTabList.map((tab) => {
          const count = statusCounts[tab.key] ?? 0;
          const isActive = status === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={`flex items-center gap-2.5 h-10 px-4.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-foreground text-background shadow-xs font-bold'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/70'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-background/25 text-background'
                    : 'bg-secondary text-foreground border border-border/80'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Multi-Dimensional Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
        {/* Search Field */}
        <div className="relative sm:col-span-2 lg:col-span-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoice, customer, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-10 pr-4 rounded-full border border-border bg-secondary/40 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all"
          />
        </div>

        {/* Fulfillment Filter */}
        <div className="lg:col-span-2.5">
          <select
            value={fulfillment}
            onChange={(e) => {
              setFulfillment(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-4 rounded-full border border-border bg-card text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
          >
            <option value="ALL">All Fulfillment Types</option>
            <option value="DELIVERY">Doorstep Delivery</option>
            <option value="PICKUP">Store Counter Pickup</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div className="lg:col-span-2.5">
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-4 rounded-full border border-border bg-card text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid Only</option>
            <option value="PENDING">Payment Pending</option>
          </select>
        </div>

        {/* Date Presets Filter */}
        <div className="lg:col-span-2">
          <select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-4 rounded-full border border-border bg-card text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="thisMonth">This Month</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="lg:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-4 rounded-full border border-border bg-card text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
          >
            <option value="placedAt_desc">Newest Placed</option>
            <option value="placedAt_asc">Oldest Placed</option>
            <option value="total_desc">Highest Amount</option>
            <option value="total_asc">Lowest Amount</option>
            <option value="invoice_asc">Invoice # (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="bg-muted/60 text-muted-foreground border-b border-border text-xs sm:text-sm uppercase tracking-wider font-bold select-none">
                <tr>
                  <th className="px-5 py-4 w-12 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllOnPage}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center"
                      title="Select / Deselect all on page"
                    >
                      {orders.length > 0 &&
                      orders.every((o) => selectedIds.includes(o.id)) ? (
                        <CheckSquare className="h-5 w-5 text-brand" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-4">Invoice</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Items</th>
                  <th className="px-5 py-4 text-right">Total Amount</th>
                  <th className="px-5 py-4">Fulfillment</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order: AdminOrderListItem) => {
                  const isSelected = selectedIds.includes(order.id);

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-brand/5' : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOrder(order.id)}
                          className="text-muted-foreground hover:text-foreground inline-flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-brand" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-medium text-foreground">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:underline hover:text-brand transition-colors"
                        >
                          {order.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-foreground">{order.customerNameSnapshot}</p>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {order.customerMobileSnapshot}
                        </p>
                        {order.notes && (
                          <div
                            className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 max-w-[190px]"
                            title={`Customer Note: ${order.notes}`}
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{order.notes}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {order.items?.length ?? 0} items
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <p className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                        {order.paymentStatus === 'PAID' ? (
                          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Paid {order.paymentMethod ? `• ${order.paymentMethod}` : ''}
                          </span>
                        ) : (
                          <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="h-2.5 w-2.5" /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-md bg-muted text-foreground w-fit">
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
                          {order.fulfillmentType === 'DELIVERY' && (
                            <span className="text-[11px] text-muted-foreground font-mono pl-0.5">
                              Fee: {toNumber(order.deliveryCharge) > 0 ? formatCurrency(toNumber(order.deliveryCharge)) : '₹0.00 (Free)'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(order.placedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPrintOrder(order)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card dark:bg-[#1a1a1a] hover:bg-muted dark:hover:bg-[#262626] text-foreground text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                            title="Print Dispatch Slip"
                          >
                            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Print Slip</span>
                          </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Unified Pagination */}
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
              itemLabel="orders"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-8 space-y-2">
          <SlidersHorizontal className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold text-foreground">No matching orders found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search criteria, date presets, or status pill filters.
          </p>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        itemLabel="orders"
      >
        <Button
          size="sm"
          variant="outline"
          className="bg-background text-foreground hover:bg-background/90 text-xs font-semibold"
          onClick={() => setBulkStatusModalOpen(true)}
        >
          Change Status ({selectedIds.length})
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-background text-foreground hover:bg-background/90 text-xs font-semibold"
          onClick={handleExportCSV}
        >
          <Download className="h-3.5 w-3.5 mr-1" /> Export Selected
        </Button>
      </BulkActionsBar>

      {/* Bulk Status Update Modal */}
      {bulkStatusModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
              <div>
                <h2 className="font-bold text-base text-foreground tracking-tight">
                  Bulk Progress Orders ({selectedIds.length} selected)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Update the status of all selected orders simultaneously and automatically trigger
                  WhatsApp updates.
                </p>
              </div>

              <div className="space-y-4">
                <Select
                  label="Target Status"
                  value={bulkTargetStatus}
                  onChange={(e) => setBulkTargetStatus(e.target.value as OrderStatus)}
                  options={[
                    { value: 'CONFIRMED', label: 'Confirmed' },
                    { value: 'ASSIGNED', label: 'Delivery Assigned' },
                    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
                    { value: 'DELIVERED', label: 'Delivered' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                  ]}
                />

                <Textarea
                  label="Status Update Audit Note (Optional)"
                  placeholder="e.g. Batch Diwali Sivakasi dispatch wave 1"
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setBulkStatusModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  className="font-medium"
                  onClick={() => bulkStatusMutation.mutate()}
                  loading={bulkStatusMutation.isPending}
                >
                  Apply to {selectedIds.length} orders
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Invoice Customizer Modal inside Orders list */}
      {selectedPrintOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="relative w-full max-w-5xl bg-white dark:bg-[#121212] rounded-2xl shadow-2xl border border-neutral-300 dark:border-neutral-800 overflow-hidden print:border-none print:shadow-none print:rounded-none print:bg-white print:overflow-visible">
            <div className="invoice-no-print px-5 py-3.5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800 print:hidden">
              <div className="flex items-center gap-2.5">
                <Printer className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-sm">Invoice Slip Preview & Customizer</span>
                <span className="text-xs text-neutral-400 font-mono">#{selectedPrintOrder.invoiceNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPrintOrder(null)}
                className="h-8 w-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
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

export default withAdminShell(AdminOrdersPageContent);

