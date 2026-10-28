'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/admin/pagination';
import { BulkActionsBar } from '@/components/admin/bulk-actions-bar';
import { Portal } from '@/components/ui/portal';
import { Select, Textarea } from '@/components/ui/input';
import { CustomDropdown } from '@/components/ui/custom-dropdown';
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
  Edit,
  Sparkles,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import Link from '@/components/ui/link';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import type { OrderStatus } from '@/db/schema';

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

  // Single Order Revoke Cancellation State & Mutation
  const [orderToRevoke, setOrderToRevoke] = useState<AdminOrderListItem | null>(null);

  const revokeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVOKE_CANCELLATION',
          targetStatus: 'NEW',
          note: 'Cancellation undone from admin orders list',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to undo order cancellation');
      return json;
    },
    onSuccess: () => {
      toast.success('Order cancellation undone successfully! Warehouse stock re-reserved.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setOrderToRevoke(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to undo order cancellation');
    },
  });

  // Bulk Delete Orders State & Mutation (deletes selected orders)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const bulkDeleteOrdersMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete selected orders');
      return json;
    },
    onSuccess: (res) => {
      toast.success(`Successfully deleted ${res.deletedCount || selectedIds.length} orders.`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete selected orders');
    },
  });

  // Quick Edit Total Amount Modal State & Mutation
  const [isEditTotalModalOpen, setIsEditTotalModalOpen] = useState(false);
  const [selectedOrderForTotal, setSelectedOrderForTotal] = useState<AdminOrderListItem | null>(null);
  const [editTotalInput, setEditTotalInput] = useState('');
  const [editTotalReasonInput, setEditTotalReasonInput] = useState('');

  const updateOrderTotalMutation = useMutation({
    mutationFn: async ({
      orderId,
      totalAmount,
      totalAmountReason,
    }: {
      orderId: number;
      totalAmount: number;
      totalAmountReason?: string;
    }) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount,
          totalAmountReason: totalAmountReason?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update total amount');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success('Order total amount updated successfully!');
      setIsEditTotalModalOpen(false);
      setSelectedOrderForTotal(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update total amount');
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
          <Link
            href="/admin/invoice-editor"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
          >
            <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>Invoice Template Editor</span>
          </Link>
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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[220px]">
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

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 lg:flex lg:items-center">
          {/* Fulfillment Filter */}
          <div className="w-full lg:w-44">
            <CustomDropdown
              value={fulfillment}
              onChange={(val) => {
                setFulfillment(val);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Fulfillment' },
                { value: 'DELIVERY', label: 'Doorstep Delivery' },
                { value: 'PICKUP', label: 'Store Pickup' },
              ]}
              ariaLabel="Filter by fulfillment"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="w-full lg:w-40">
            <CustomDropdown
              value={paymentStatus}
              onChange={(val) => {
                setPaymentStatus(val);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Payments' },
                { value: 'PAID', label: 'Paid Only' },
                { value: 'PENDING', label: 'Payment Pending' },
              ]}
              ariaLabel="Filter by payment status"
            />
          </div>

          {/* Date Presets Filter */}
          <div className="w-full lg:w-36">
            <CustomDropdown
              value={datePreset}
              onChange={(val) => {
                setDatePreset(val);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Dates' },
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'last7days', label: 'Last 7 Days' },
                { value: 'thisMonth', label: 'This Month' },
              ]}
              ariaLabel="Filter by date"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-full lg:w-44">
            <CustomDropdown
              value={sortBy}
              onChange={(val) => {
                setSortBy(val);
                setPage(1);
              }}
              options={[
                { value: 'placedAt_desc', label: 'Newest Placed' },
                { value: 'placedAt_asc', label: 'Oldest Placed' },
                { value: 'total_desc', label: 'Highest Amount' },
                { value: 'total_asc', label: 'Lowest Amount' },
                { value: 'invoice_asc', label: 'Invoice # (A-Z)' },
              ]}
              ariaLabel="Sort orders"
            />
          </div>
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
            <table className="admin-data-table w-full text-left text-base">
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
                        <div className="flex items-center justify-end gap-1.5 group">
                          <p className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</p>
                          <button
                            type="button"
                            title="Edit Total Amount"
                            onClick={() => {
                              setSelectedOrderForTotal(order);
                              setEditTotalInput(String(toNumber(order.totalAmount)));
                              setEditTotalReasonInput('');
                              setIsEditTotalModalOpen(true);
                            }}
                            className="p-1 rounded-md text-muted-foreground hover:text-brand hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
                          {order.orderStatus === 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => setOrderToRevoke(order)}
                              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                              title="Undo Order Cancellation & Re-reserve Stock"
                            >
                              <RotateCcw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Undo</span>
                            </button>
                          )}
                          <Link
                            href={`/admin/invoice-editor?orderId=${order.id}&print=true`}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card dark:bg-[#1a1a1a] hover:bg-muted dark:hover:bg-[#262626] text-foreground text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                            title="Open Invoice & Print in Dedicated Page"
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
          className="h-8 px-3.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 border-0 text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-all active:scale-95"
          onClick={() => setBulkStatusModalOpen(true)}
        >
          Change Status ({selectedIds.length})
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 border-0 text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-all active:scale-95"
          onClick={handleExportCSV}
        >
          <Download className="h-3.5 w-3.5 mr-1" /> Export Selected
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-8 px-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white border-0 text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-all active:scale-95"
          onClick={() => setIsBulkDeleteModalOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Selected ({selectedIds.length})
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

      {/* Quick Edit Total Amount Modal */}
      {isEditTotalModalOpen && selectedOrderForTotal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-card rounded-[28px] border border-border max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand/10 text-brand border border-brand/20">
                    <Sparkles className="h-3 w-3" /> Admin Total Override
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Edit Total Amount
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Invoice: <span className="font-mono font-bold text-foreground">{selectedOrderForTotal.invoiceNumber}</span> • Customer: <span className="font-medium text-foreground">{selectedOrderForTotal.customerNameSnapshot}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTotalModalOpen(false);
                    setSelectedOrderForTotal(null);
                  }}
                  className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Amount Info */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Current Total Amount:</span>
                <span className="font-mono text-sm font-bold text-foreground">{formatCurrency(selectedOrderForTotal.totalAmount)}</span>
              </div>

              {/* Input: New Total Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  New Total Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-muted-foreground">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={editTotalInput}
                    onChange={(e) => setEditTotalInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-background border-2 border-border focus:border-brand focus:outline-hidden font-mono text-lg font-bold text-foreground transition-all shadow-inner"
                  />
                </div>
                {(() => {
                  const parsed = parseFloat(editTotalInput);
                  if (isNaN(parsed)) return null;
                  const currentTotal = toNumber(selectedOrderForTotal.totalAmount);
                  const diff = parsed - currentTotal;
                  if (Math.abs(diff) < 0.01) return null;
                  return (
                    <p className={`text-xs font-semibold ${diff > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {diff > 0 ? `+${formatCurrency(diff)} increase` : `${formatCurrency(diff)} reduction`} from original
                    </p>
                  );
                })()}
              </div>

              {/* Input: Reason / Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Adjustment Reason <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={editTotalReasonInput}
                  onChange={(e) => setEditTotalReasonInput(e.target.value)}
                  placeholder="e.g. Offline discount, round-off, special pricing"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-brand focus:outline-hidden text-xs text-foreground transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditTotalModalOpen(false);
                    setSelectedOrderForTotal(null);
                  }}
                  disabled={updateOrderTotalMutation.isPending}
                  className="rounded-full text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const parsed = parseFloat(editTotalInput);
                    if (isNaN(parsed) || parsed < 0) {
                      toast.error('Please enter a valid non-negative amount');
                      return;
                    }
                    updateOrderTotalMutation.mutate({
                      orderId: selectedOrderForTotal.id,
                      totalAmount: parsed,
                      totalAmountReason: editTotalReasonInput,
                    });
                  }}
                  loading={updateOrderTotalMutation.isPending}
                  disabled={updateOrderTotalMutation.isPending}
                  className="h-10 px-5 rounded-full font-bold text-xs !bg-[#e24000] hover:!bg-[#c93800] !text-white cursor-pointer shadow-md shadow-[#e24000]/20 transition-all border-0 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0 !text-white" />
                  Save Total Amount
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Revoke Cancellation Confirmation Modal */}
      {orderToRevoke && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
              onClick={() => !revokeOrderMutation.isPending && setOrderToRevoke(null)}
            />
            <div className="relative w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-scale-in z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Undo Order Cancellation?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Order-{orderToRevoke.invoiceNumber} • {orderToRevoke.customerNameSnapshot}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Undoing this cancellation will check warehouse availability, re-reserve all cracker items from stock, and reactivate the order to <strong>New Order (NEW)</strong>.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setOrderToRevoke(null)}
                  disabled={revokeOrderMutation.isPending}
                  className="flex-1 h-10 rounded-full text-xs font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => revokeOrderMutation.mutate(orderToRevoke.id)}
                  disabled={revokeOrderMutation.isPending}
                  className="flex-1 h-10 rounded-full font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-md transition-all border-0 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  {revokeOrderMutation.isPending ? 'Re-reserving...' : 'Confirm Undo'}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Bulk Delete Orders Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
              onClick={() => !bulkDeleteOrdersMutation.isPending && setIsBulkDeleteModalOpen(false)}
            />
            <div className="relative w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-scale-in z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Delete {selectedIds.length} Orders?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This will permanently delete all {selectedIds.length} selected orders.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                Any active orders in this selection will have their reserved cracker stock restored to warehouse inventory. All selected orders, items, assignments, and histories will be permanently removed. This action cannot be undone.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  disabled={bulkDeleteOrdersMutation.isPending}
                  className="flex-1 h-10 rounded-full text-xs font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => bulkDeleteOrdersMutation.mutate(selectedIds)}
                  disabled={bulkDeleteOrdersMutation.isPending}
                  className="flex-1 h-10 rounded-full font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md transition-all border-0 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {bulkDeleteOrdersMutation.isPending ? 'Deleting...' : `Delete ${selectedIds.length} Orders`}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export default withAdminShell(AdminOrdersPageContent);

