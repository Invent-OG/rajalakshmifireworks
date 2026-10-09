'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Copy,
  ExternalLink,
  Edit,
  Download,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Truck,
  ShoppingCart,
  TrendingUp,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/admin/pagination';
import { withAdminShell } from '@/components/admin/admin-shell';
import Link from '@/components/ui/link';

interface AdminAgentDetailProps {
  id: string | number;
}

function AdminAgentDetailContent({ id }: AdminAgentDetailProps) {
  const agentId = Number(id);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    mobile: '',
    email: '',
    location: '',
    agentCode: '',
    referralCode: '',
    joiningDate: '',
    isActive: true,
  });

  // Query Agent Info & Overall Stats
  const { data: agentData, isLoading: isAgentLoading } = useQuery({
    queryKey: ['admin', 'sales', 'agent', agentId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/sales/agents/${agentId}`);
      if (!res.ok) throw new Error('Failed to load agent profile');
      return res.json();
    },
  });

  // Query Agent Attributed Orders
  const { data: ordersData, isLoading: isOrdersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['admin', 'sales', 'agent-orders', agentId, { page, limit, statusFilter, search, dateFrom, dateTo }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/sales/agents/${agentId}/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load agent orders');
      return res.json();
    },
  });

  const agent = agentData?.agent;
  const orderList = ordersData?.orders || [];
  const pagination = ordersData?.pagination || { total: 0, totalPages: 1, page: 1, limit: 20 };

  // Update Agent Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: typeof editForm) => {
      const res = await fetch(`/api/admin/sales/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update agent');
      return data;
    },
    onSuccess: () => {
      toast.success('Agent updated successfully');
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'agent', agentId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'agents'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleOpenEdit = () => {
    if (!agent) return;
    setEditForm({
      name: agent.name,
      mobile: agent.mobile,
      email: agent.email || '',
      location: agent.location || '',
      agentCode: agent.agentCode,
      referralCode: agent.referralCode,
      joiningDate: agent.joiningDate ? new Date(agent.joiningDate).toISOString().slice(0, 10) : '',
      isActive: agent.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleCopyReferralUrl = () => {
    if (!agent) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rajalakshmifireworks.com';
    const url = `${origin}/?ref=${agent.referralCode}`;
    navigator.clipboard.writeText(url);
    toast.success(`Referral URL copied: ${url}`);
  };

  const handleExportOrders = () => {
    window.location.href = `/api/admin/sales/export?type=agent-orders&agentId=${agentId}`;
  };

  if (isAgentLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-xl mx-auto mb-4" />
        <p className="text-sm">Loading agent profile...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-4">
        <Users className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Agent Not Found</h2>
        <p className="text-xs text-muted-foreground">The specified sales agent does not exist or has been removed.</p>
        <Link
          href="/admin/sales/agents"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-bold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Agents Directory
        </Link>
      </div>
    );
  }

  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${agent.referralCode}`
    : `https://rajalakshmifireworks.com/?ref=${agent.referralCode}`;

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/sales/agents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Agents Directory
        </Link>
      </div>

      {/* Agent Identity & Header Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 text-brand font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {agent.name}
              </h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                {agent.agentCode}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  agent.isActive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20'
                }`}
              >
                {agent.isActive ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Active Agent
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" /> Inactive
                  </>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-foreground/70" />
                <span className="font-mono">{agent.mobile}</span>
              </span>
              {agent.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-foreground/70" />
                  <span>{agent.email}</span>
                </span>
              )}
              {agent.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-foreground/70" />
                  <span>{agent.location}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-foreground/70" />
                <span>Joined: {formatDateTime(agent.joiningDate)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenEdit}
            className="rounded-xl font-bold cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExportOrders}
            className="rounded-xl bg-brand text-brand-foreground hover:brightness-105 font-bold cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export Orders (.xlsx)
          </Button>
        </div>
      </div>

      {/* Referral Link & Attribution Box */}
      <div className="p-5 rounded-2xl bg-brand/5 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Unique Referral Code & Attribution Link
            </span>
            <span className="font-mono font-black text-sm text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/30">
              {agent.referralCode}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate max-w-2xl select-all">
            {referralUrl}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={handleCopyReferralUrl}
            className="rounded-xl bg-brand text-brand-foreground hover:brightness-105 font-bold shadow-xs cursor-pointer active:scale-95"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Referral Link
          </Button>
        </div>
      </div>

      {/* KPI Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Total Orders
          </span>
          <div className="text-2xl font-black text-foreground font-mono">
            {agent.totalOrders}
          </div>
          <p className="text-[10px] text-muted-foreground">All attributed orders</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Delivered
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {agent.deliveredOrders}
          </div>
          <p className="text-[10px] text-muted-foreground">Successfully fulfilled</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Cancelled
          </span>
          <div className="text-2xl font-black text-muted-foreground font-mono">
            {agent.cancelledOrders}
          </div>
          <p className="text-[10px] text-muted-foreground">Order dropouts</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Attributed Gross
          </span>
          <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
            {formatCurrency(agent.totalOrderValue)}
          </div>
          <p className="text-[10px] text-muted-foreground">Pipeline order value</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Delivered Sales
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(agent.deliveredOrderValue)}
          </div>
          <p className="text-[10px] text-muted-foreground">Completed net sales</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Avg Order (AOV)
          </span>
          <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
            {formatCurrency(agent.averageOrderValue)}
          </div>
          <p className="text-[10px] text-muted-foreground">Per order basket size</p>
        </div>
      </div>

      {/* Attributed Orders History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div>
            <h2 className="font-bold text-base text-foreground">Attributed Order History</h2>
            <p className="text-xs text-muted-foreground">
              Customer orders generated through agent referral code ({orderList.length} shown)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 px-2.5 rounded-lg bg-muted/40 border border-border text-xs font-semibold text-foreground focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/60 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-bold select-none">
                <tr>
                  <th className="px-5 py-3.5">Invoice</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Fulfillment</th>
                  <th className="px-4 py-3.5 text-right">Order Value</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Attribution</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isOrdersLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="px-5 py-4">
                        <div className="h-6 bg-muted/60 rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : orderList.length > 0 ? (
                  orderList.map((order: any) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      {/* Invoice */}
                      <td className="px-5 py-3.5 font-mono font-bold text-foreground whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:text-brand transition-colors"
                        >
                          {order.invoiceNumber}
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{order.customerMobile}</div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(order.placedAt)}
                      </td>

                      {/* Fulfillment */}
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        <span className="font-medium text-foreground">
                          {order.fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Counter Pickup'}
                        </span>
                      </td>

                      {/* Order Value */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground whitespace-nowrap">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={order.orderStatus} />
                      </td>

                      {/* Attribution Source */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                            order.attributionSource === 'LINK'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {order.attributionSource === 'LINK' ? (
                            <>
                              <LinkIcon className="h-2.5 w-2.5" /> Referral Link
                            </>
                          ) : (
                            <>
                              <Copy className="h-2.5 w-2.5" /> Entered Code
                            </>
                          )}
                        </span>
                      </td>

                      {/* Inspect Order */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs"
                          title="Open Order Details"
                        >
                          <span>View</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <p className="font-semibold text-sm">No orders found for this agent</p>
                      <p className="text-xs mt-1">Orders placed with referral code {agent.referralCode} will appear here.</p>
                    </td>
                  </tr>
                )}
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
                setLimit(sz);
                setPage(1);
              }}
              itemLabel="orders"
            />
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground">Edit Agent Details</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(editForm);
              }}
              className="p-5 space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-foreground">Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Mobile</label>
                  <input
                    type="tel"
                    required
                    value={editForm.mobile}
                    onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Territory</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Joining Date</label>
                  <input
                    type="date"
                    value={editForm.joiningDate}
                    onChange={(e) => setEditForm((p) => ({ ...p, joiningDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="modalActiveCheckbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded text-brand h-4 w-4"
                />
                <label htmlFor="modalActiveCheckbox" className="font-semibold text-xs text-foreground cursor-pointer">
                  Agent Active
                </label>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-xl bg-brand text-brand-foreground font-bold"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAdminShell(AdminAgentDetailContent);
