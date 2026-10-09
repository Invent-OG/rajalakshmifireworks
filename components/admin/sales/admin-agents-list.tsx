'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Edit,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/admin/pagination';
import { withAdminShell } from '@/components/admin/admin-shell';
import Link from '@/components/ui/link';

interface SalesAgentRow {
  id: number;
  agentCode: string;
  name: string;
  referralCode: string;
  mobile: string;
  email: string | null;
  location: string | null;
  joiningDate: string;
  isActive: boolean;
  totalOrders: number;
  newOrders: number;
  processingOrders: number;
  dispatchedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalOrderValue: number;
  deliveredOrderValue: number;
}

function AdminAgentsListContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<SalesAgentRow | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    mobile: '',
    email: '',
    location: '',
    agentCode: '',
    referralCode: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    isActive: true,
  });

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

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'sales', 'agents', { page, limit, search, status, dateFrom, dateTo }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (status !== 'ALL') params.set('status', status);
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/sales/agents?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load agents');
      return res.json();
    },
  });

  const agents: SalesAgentRow[] = data?.agents || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1, page: 1, limit: 25 };

  // Create Agent Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof createForm) => {
      const res = await fetch('/api/admin/sales/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create agent');
      return data;
    },
    onSuccess: () => {
      toast.success('Sales agent created successfully');
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        mobile: '',
        email: '',
        location: '',
        agentCode: '',
        referralCode: '',
        joiningDate: new Date().toISOString().slice(0, 10),
        isActive: true,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'tracking'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Update Agent Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: typeof editForm }) => {
      const res = await fetch(`/api/admin/sales/agents/${id}`, {
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
      setSelectedAgent(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'tracking'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/admin/sales/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Agent ${vars.isActive ? 'activated' : 'deactivated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', 'tracking'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleOpenEdit = (agent: SalesAgentRow) => {
    setSelectedAgent(agent);
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

  const handleExportExcel = () => {
    window.location.href = '/api/admin/sales/export?type=agents';
  };

  const handleCopyReferralUrl = (referralCode: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rajalakshmifireworks.com';
    const url = `${origin}/?ref=${referralCode}`;
    navigator.clipboard.writeText(url);
    toast.success(`Referral URL copied: ${url}`);
  };

  // Helper to suggest referral code from name
  const handleSuggestReferralCode = (name: string, isCreate: boolean) => {
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const prefix = clean.slice(0, 4) || 'REF';
    const rand = Math.floor(10 + Math.random() * 90);
    const code = `${prefix}${rand}`;
    if (isCreate) {
      setCreateForm((prev) => ({ ...prev, referralCode: code }));
    } else {
      setEditForm((prev) => ({ ...prev, referralCode: code }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Users className="h-4 w-4 text-brand" />
            <span>Sales Force Roster</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            Sales Agents Directory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage agents, unique referral codes, tracking statuses, and revenue contributions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-9 px-3.5 rounded-xl border-border bg-card text-foreground font-bold shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Excel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-brand text-brand-foreground hover:brightness-105 font-bold shadow-xs cursor-pointer active:scale-95"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Add New Agent
          </Button>
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, agent ID, code, phone, territory..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Pills */}
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs">
            <button
              onClick={() => {
                setStatus('ALL');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                status === 'ALL'
                  ? 'bg-brand text-brand-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Agents
            </button>
            <button
              onClick={() => {
                setStatus('ACTIVE');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                status === 'ACTIVE'
                  ? 'bg-brand text-brand-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setStatus('INACTIVE');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                status === 'INACTIVE'
                  ? 'bg-brand text-brand-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Inactive
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-brand' : ''}`} />
          </button>
        </div>
      </div>

      {/* Agents Performance Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted/60 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-bold select-none">
              <tr>
                <th className="px-5 py-3.5">Agent Profile</th>
                <th className="px-4 py-3.5">Referral Code</th>
                <th className="px-4 py-3.5 text-center">Attributed Orders</th>
                <th className="px-4 py-3.5 text-center">Delivered</th>
                <th className="px-4 py-3.5 text-center">Cancelled</th>
                <th className="px-4 py-3.5 text-right">Attributed Value</th>
                <th className="px-4 py-3.5 text-right">Delivered Sales</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-5 py-4">
                      <div className="h-6 bg-muted/60 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : agents.length > 0 ? (
                agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Agent Profile & Contact */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-bold text-xs flex items-center justify-center shrink-0 border border-brand/20">
                          {agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/sales/agents/${agent.id}`}
                              className="font-bold text-foreground hover:text-brand transition-colors text-sm"
                            >
                              {agent.name}
                            </Link>
                            <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                              {agent.agentCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{agent.mobile}</span>
                            {agent.location && (
                              <>
                                <span>•</span>
                                <span>{agent.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Referral Code & Copy Link */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded text-xs border border-brand/20">
                          {agent.referralCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyReferralUrl(agent.referralCode)}
                          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                          title="Copy Referral Link"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Total Orders */}
                    <td className="px-4 py-4 text-center whitespace-nowrap font-mono font-bold text-foreground">
                      {agent.totalOrders}
                      {agent.newOrders > 0 && (
                        <span className="ml-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          ({agent.newOrders} new)
                        </span>
                      )}
                    </td>

                    {/* Delivered Orders */}
                    <td className="px-4 py-4 text-center whitespace-nowrap font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {agent.deliveredOrders}
                    </td>

                    {/* Cancelled Orders */}
                    <td className="px-4 py-4 text-center whitespace-nowrap font-mono text-muted-foreground">
                      {agent.cancelledOrders > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          {agent.cancelledOrders}
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>

                    {/* Total Attributed Value */}
                    <td className="px-4 py-4 text-right whitespace-nowrap font-mono font-medium text-foreground">
                      {formatCurrency(agent.totalOrderValue)}
                    </td>

                    {/* Delivered Sales Value */}
                    <td className="px-4 py-4 text-right whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(agent.deliveredOrderValue)}
                    </td>

                    {/* Status Pill */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleStatusMutation.mutate({ id: agent.id, isActive: !agent.isActive })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all active:scale-95 ${
                          agent.isActive
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20 hover:bg-neutral-500/20'
                        }`}
                        title="Click to toggle active status"
                      >
                        {agent.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(agent)}
                          className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold shadow-xs transition-all cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 inline" />
                          <span>Edit</span>
                        </button>

                        <Link
                          href={`/admin/sales/agents/${agent.id}`}
                          className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-xs inline-flex items-center gap-1 transition-all active:scale-95"
                          title="Inspect Agent Profile"
                        >
                          <span>Profile</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-foreground">No agents found</p>
                    <p className="text-xs mt-1">Try clearing filters or click &quot;Add New Agent&quot; above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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
            itemLabel="agents"
          />
        </div>
      </div>

      {/* CREATE AGENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Register Sales Agent</h3>
                  <p className="text-xs text-muted-foreground">Issue unique referral code and tracking identity</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(createForm);
              }}
              className="p-5 space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-foreground">Agent Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kannan"
                    value={createForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCreateForm((p) => ({ ...p, name }));
                      if (!createForm.referralCode && name.length >= 3) {
                        handleSuggestReferralCode(name, true);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={createForm.mobile}
                    onChange={(e) => setCreateForm((p) => ({ ...p, mobile: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-mono focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="agent@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-foreground">Agent ID</label>
                    <span className="text-[10px] text-muted-foreground">Auto-assigned if blank</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Auto (e.g. AGT-006)"
                    value={createForm.agentCode}
                    onChange={(e) => setCreateForm((p) => ({ ...p, agentCode: e.target.value.toUpperCase() }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-mono uppercase focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-foreground">Unique Referral Code</label>
                    <button
                      type="button"
                      onClick={() => handleSuggestReferralCode(createForm.name || 'AGENT', true)}
                      className="text-[10px] text-brand font-bold hover:underline cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. RAMESH01"
                    value={createForm.referralCode}
                    onChange={(e) => setCreateForm((p) => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-mono uppercase focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Territory / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Madurai Central"
                    value={createForm.location}
                    onChange={(e) => setCreateForm((p) => ({ ...p, location: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Joining Date</label>
                  <input
                    type="date"
                    value={createForm.joiningDate}
                    onChange={(e) => setCreateForm((p) => ({ ...p, joiningDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="agentActiveCheckbox"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded text-brand focus:ring-brand h-4 w-4"
                />
                <label htmlFor="agentActiveCheckbox" className="font-semibold text-xs text-foreground cursor-pointer">
                  Activate agent immediately for order referrals
                </label>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-brand text-brand-foreground font-bold hover:brightness-105"
                >
                  {createMutation.isPending ? 'Creating...' : 'Save Agent'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT AGENT MODAL */}
      {isEditModalOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Edit Sales Agent</h3>
                  <p className="text-xs text-muted-foreground">{selectedAgent.name} ({selectedAgent.agentCode})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ id: selectedAgent.id, payload: editForm });
              }}
              className="p-5 space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-foreground">Agent Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.mobile}
                    onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-mono focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Agent ID</label>
                  <input
                    type="text"
                    required
                    value={editForm.agentCode}
                    onChange={(e) => setEditForm((p) => ({ ...p, agentCode: e.target.value.toUpperCase() }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-mono uppercase focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Referral Code</label>
                  <input
                    type="text"
                    required
                    value={editForm.referralCode}
                    onChange={(e) => setEditForm((p) => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-mono uppercase focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Territory / Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Joining Date</label>
                  <input
                    type="date"
                    value={editForm.joiningDate}
                    onChange={(e) => setEditForm((p) => ({ ...p, joiningDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs focus:ring-1 focus:ring-brand focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editAgentActiveCheckbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded text-brand focus:ring-brand h-4 w-4"
                />
                <label htmlFor="editAgentActiveCheckbox" className="font-semibold text-xs text-foreground cursor-pointer">
                  Active (Allowed to generate referrals)
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
                  className="rounded-xl bg-brand text-brand-foreground font-bold hover:brightness-105"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAdminShell(AdminAgentsListContent);
