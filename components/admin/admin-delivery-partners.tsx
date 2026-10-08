'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  Phone,
  MapPin,
  Car,
  AlertTriangle,
  X,
  Mail,
  FileText,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/query/keys';
import { formatDateTime } from '@/lib/utils/format';

interface DeliveryPartner {
  id: number;
  name: string;
  fullName?: string;
  mobileNumber: string;
  email: string | null;
  address: string | null;
  pincode: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  notes: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  serviceableAreas?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

import { withAdminShell } from './admin-shell';

function AdminDeliveryPartnersPageContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);
  const [detailsPartner, setDetailsPartner] = useState<DeliveryPartner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<DeliveryPartner | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    address: '',
    pincode: '',
    vehicleType: '',
    vehicleNumber: '',
    notes: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    serviceableAreas: [] as string[],
  });

  const [areaInput, setAreaInput] = useState('');

  const handleAddArea = (areaName?: string) => {
    const nameToAdd = (areaName || areaInput).trim();
    if (!nameToAdd) return;
    if (formData.serviceableAreas.some((a) => a.toLowerCase() === nameToAdd.toLowerCase())) {
      toast.info(`"${nameToAdd}" is already in the list`);
      setAreaInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      serviceableAreas: [...prev.serviceableAreas, nameToAdd],
    }));
    setAreaInput('');
  };

  const handleRemoveArea = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      serviceableAreas: prev.serviceableAreas.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Fetch Delivery Partners
  const { data: partners = [], isLoading } = useQuery<DeliveryPartner[]>({
    queryKey: queryKeys.admin.deliveryPartners.list({ search, status: statusFilter }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      const res = await fetch(`/api/admin/delivery-partners?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch delivery partners');
      return res.json();
    },
  });

  // Open Add Modal
  function handleOpenAdd() {
    setEditingPartner(null);
    setFormData({
      name: '',
      mobileNumber: '',
      email: '',
      address: '',
      pincode: '',
      vehicleType: '',
      vehicleNumber: '',
      notes: '',
      status: 'ACTIVE',
      serviceableAreas: [],
    });
    setAreaInput('');
    setIsFormOpen(true);
  }

  // Open Edit Modal
  function handleOpenEdit(partner: DeliveryPartner) {
    setEditingPartner(partner);
    setFormData({
      name: partner.name || partner.fullName || '',
      mobileNumber: partner.mobileNumber,
      email: partner.email || '',
      address: partner.address || '',
      pincode: partner.pincode || '',
      vehicleType: partner.vehicleType || '',
      vehicleNumber: partner.vehicleNumber || '',
      notes: partner.notes || '',
      status: partner.status,
      serviceableAreas: Array.isArray(partner.serviceableAreas) ? partner.serviceableAreas : [],
    });
    setAreaInput('');
    setIsFormOpen(true);
  }

  // Save (Create or Update) Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        vehicleType: formData.vehicleType.trim() || undefined,
        vehicleNumber: formData.vehicleNumber.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
        serviceableAreas: formData.serviceableAreas,
      };

      if (!payload.name) {
        throw new Error('Full name is required');
      }

      if (!payload.mobileNumber || !/^[6-9]\d{9}$/.test(payload.mobileNumber)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      const url = editingPartner
        ? `/api/admin/delivery-partners/${editingPartner.id}`
        : '/api/admin/delivery-partners';
      const method = editingPartner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Failed to save delivery partner');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(editingPartner ? 'Delivery partner updated' : 'Delivery partner created');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.deliveryPartners.all });
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'An error occurred');
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: 'ACTIVE' | 'INACTIVE' }) => {
      const res = await fetch(`/api/admin/delivery-partners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update status');
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast.success(`Partner marked as ${vars.newStatus.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.deliveryPartners.all });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to toggle status');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/delivery-partners/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete partner');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Delivery partner removed');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.deliveryPartners.all });
      setDeletingPartner(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete partner');
    },
  });

  // Stats
  const totalCount = partners.length;
  const activeCount = partners.filter((p) => p.status === 'ACTIVE').length;
  const inactiveCount = partners.filter((p) => p.status === 'INACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Truck className="h-7 w-7 text-brand" /> Delivery Partners
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage delivery personnel and fleet partners eligible for order fulfillment across India.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="h-12 px-5 font-bold text-sm gap-2 shadow-xs">
          <Plus className="h-5 w-5" /> Add Delivery Partner
        </Button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Total Partners</p>
          <p className="text-3xl font-bold text-foreground mt-1.5">{totalCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Active</p>
          <p className="text-3xl font-bold text-emerald-500 mt-1.5">{activeCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Inactive</p>
          <p className="text-3xl font-bold text-amber-500 mt-1.5">{inactiveCount}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-secondary/60 dark:bg-[#242424]/60 text-muted-foreground hover:text-foreground border border-border hover:bg-secondary'
              }`}
            >
              {st === 'ALL' ? 'All Partners' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, mobile number, or vehicle number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Partners List Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : partners.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:text-base">
              <thead className="bg-secondary/50 dark:bg-[#242424]/50 text-muted-foreground border-b border-border text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Mobile</th>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">Serviceable Areas</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {partners.map((partner) => {
                  const isActive = partner.status === 'ACTIVE';

                  return (
                    <tr key={partner.id} className="hover:bg-secondary/30 dark:hover:bg-[#242424]/30 transition-colors">
                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-foreground text-base">{partner.name || partner.fullName}</p>
                        {partner.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Mail className="h-3.5 w-3.5" /> {partner.email}
                          </p>
                        )}
                      </td>

                      {/* Mobile */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-foreground font-mono text-sm font-bold">
                          <Phone className="h-4 w-4 text-muted-foreground" /> {partner.mobileNumber}
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-5 py-4 text-sm text-foreground">
                        {partner.vehicleType || partner.vehicleNumber ? (
                          <div className="space-y-1">
                            <p className="font-semibold flex items-center gap-1.5">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              {partner.vehicleType || 'Vehicle'}
                            </p>
                            {partner.vehicleNumber && (
                              <p className="font-mono text-xs text-muted-foreground uppercase font-semibold">{partner.vehicleNumber}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Serviceable Areas */}
                      <td className="px-5 py-4">
                        {partner.serviceableAreas && partner.serviceableAreas.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {partner.serviceableAreas.slice(0, 3).map((area, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand/10 text-brand border border-brand/20"
                              >
                                <MapPin className="h-2.5 w-2.5" /> {area}
                              </span>
                            ))}
                            {partner.serviceableAreas.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground">
                                +{partner.serviceableAreas.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">All areas / Not specified</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: partner.id,
                              newStatus: isActive ? 'INACTIVE' : 'ACTIVE',
                            })
                          }
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-secondary/60 dark:bg-[#242424]/60 text-muted-foreground border-border hover:bg-secondary'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-muted-foreground" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailsPartner(partner)}
                            title="View Details"
                            className="p-2 rounded-lg border border-border bg-card hover:bg-secondary dark:hover:bg-[#242424] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(partner)}
                            title="Edit Partner"
                            className="p-2 rounded-lg border border-border bg-card hover:bg-secondary dark:hover:bg-[#242424] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPartner(partner)}
                            title="Delete Partner"
                            className="p-2 rounded-lg border border-border bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-8 space-y-2">
          <Truck className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-semibold text-foreground">No delivery partners found</p>
          <p className="text-xs text-muted-foreground">
            Click "Add Delivery Partner" above to register a new delivery personnel.
          </p>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-brand" />
                {editingPartner ? 'Edit Delivery Partner' : 'Add Delivery Partner'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary dark:hover:bg-[#242424] hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 overflow-y-auto space-y-4.5 text-sm">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-12 px-3.5 rounded-xl border border-border bg-card text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand shadow-xs"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Mobile Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9842100001"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full h-12 px-3.5 rounded-xl border border-border bg-card text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand shadow-xs"
                />
              </div>

              {/* Email & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="rajesh@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 px-3.5 rounded-xl border border-border bg-card text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Pincode (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 626123"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full h-12 px-3.5 rounded-xl border border-border bg-card text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand shadow-xs"
                  />
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Vehicle Type (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bike, Van, Tata Ace"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full h-12 px-3.5 rounded-xl border border-border bg-card text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Vehicle Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TN 67 AB 1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full h-12 px-3.5 rounded-xl border border-border bg-card text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand uppercase shadow-xs"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Address / Hub (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Street address or logistics hub"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-card text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand resize-none shadow-xs"
                />
              </div>

              {/* Serviceable Delivery Areas */}
              <div className="p-4 rounded-2xl bg-secondary/30 dark:bg-[#242424]/40 border border-border space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand" />
                    <label className="text-sm font-bold text-foreground">
                      Serviceable Delivery Areas / Localities
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Specify the towns, cities, or areas this partner is available to deliver to. These areas will appear in the customer checkout dropdown.
                  </p>
                </div>

                {/* Add Area Input Bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type area (e.g. Sivakasi Town, Virudhunagar, Madurai, Anna Nagar)..."
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddArea();
                      }
                    }}
                    className="flex-1 h-11 px-3.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand shadow-xs"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddArea()}
                    className="h-11 px-4 text-xs font-bold gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Area
                  </Button>
                </div>

                {/* Quick Area Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Quick Tamil Nadu Suggestions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Sivakasi Town',
                      'Thiruthangal',
                      'Virudhunagar',
                      'Sattur',
                      'Madurai City',
                      'Coimbatore',
                      'Chennai Central',
                      'Tirunelveli',
                      'Dindigul',
                      'Salem',
                      'Trichy',
                    ].map((preset) => {
                      const isAdded = formData.serviceableAreas.some(
                        (a) => a.toLowerCase() === preset.toLowerCase()
                      );
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddArea(preset)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-muted/50 text-muted-foreground/60 border-transparent cursor-not-allowed'
                              : 'bg-card hover:bg-brand/10 hover:text-brand hover:border-brand/30 border-border text-foreground font-medium'
                          }`}
                        >
                          + {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Added Areas Tags List */}
                {formData.serviceableAreas.length > 0 ? (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[11px] font-bold text-foreground block mb-2">
                      Assigned Areas ({formData.serviceableAreas.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {formData.serviceableAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand text-brand-foreground shadow-2xs group"
                        >
                          <MapPin className="h-3 w-3 opacity-80" />
                          <span>{area}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveArea(idx)}
                            className="h-4 w-4 rounded-full hover:bg-black/20 flex items-center justify-center cursor-pointer ml-0.5"
                            title={`Remove ${area}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic pt-1">
                    No areas added yet. Please add at least one area so this partner displays on the customer checkout dropdown.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Internal Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, contact timing, routes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border bg-card text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand resize-none shadow-xs"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Status</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                    <input
                      type="radio"
                      name="partner_status"
                      value="ACTIVE"
                      checked={formData.status === 'ACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                      className="accent-brand h-4 w-4"
                    />
                    <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                    <input
                      type="radio"
                      name="partner_status"
                      value="INACTIVE"
                      checked={formData.status === 'INACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'INACTIVE' })}
                      className="accent-brand h-4 w-4"
                    />
                    <span className="text-muted-foreground">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-secondary/30 dark:bg-[#242424]/30">
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={saveMutation.isPending}
                className="h-11 px-5 text-sm font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="h-11 px-5 gap-2 font-bold text-sm"
              >
                {saveMutation.isPending ? 'Saving...' : editingPartner ? 'Update Partner' : 'Create Partner'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {detailsPartner && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{detailsPartner.name || detailsPartner.fullName}</h3>
                  <p className="text-[11px] text-muted-foreground">ID #{detailsPartner.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsPartner(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                    detailsPartner.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {detailsPartner.status}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/20 border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Mobile Number</span>
                <span className="font-mono font-bold text-foreground text-sm">{detailsPartner.mobileNumber}</span>
              </div>

              {detailsPartner.email && (
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Email</span>
                  <span className="text-foreground">{detailsPartner.email}</span>
                </div>
              )}

              {(detailsPartner.vehicleType || detailsPartner.vehicleNumber) && (
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Vehicle</span>
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" /> {detailsPartner.vehicleType || 'Not specified'}
                  </p>
                  {detailsPartner.vehicleNumber && (
                    <p className="font-mono uppercase text-muted-foreground">{detailsPartner.vehicleNumber}</p>
                  )}
                </div>
              )}

              {detailsPartner.address && (
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Address</span>
                  <p className="text-foreground">{detailsPartner.address}</p>
                  {detailsPartner.pincode && <p className="text-muted-foreground">PIN: {detailsPartner.pincode}</p>}
                </div>
              )}

              {/* Serviceable Areas in Details */}
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1.5">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                  Serviceable Delivery Areas ({detailsPartner.serviceableAreas?.length ?? 0})
                </span>
                {detailsPartner.serviceableAreas && detailsPartner.serviceableAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {detailsPartner.serviceableAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand/10 text-brand border border-brand/20"
                      >
                        <MapPin className="h-3 w-3" /> {area}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No specific areas configured</p>
                )}
              </div>

              {detailsPartner.notes && (
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Internal Notes</span>
                  <p className="text-foreground">{detailsPartner.notes}</p>
                </div>
              )}

              <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border">
                <span>Created: {formatDateTime(detailsPartner.createdAt)}</span>
                <span>Updated: {formatDateTime(detailsPartner.updatedAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const p = detailsPartner;
                  setDetailsPartner(null);
                  handleOpenEdit(p);
                }}
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Partner
              </Button>
              <Button size="sm" onClick={() => setDetailsPartner(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingPartner && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-foreground text-sm">Delete Delivery Partner?</h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to remove <strong className="text-foreground">{deletingPartner.name || deletingPartner.fullName}</strong>?
                If they have historical orders, their status will be set to Inactive to preserve records.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPartner(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate(deletingPartner.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAdminShell(AdminDeliveryPartnersPageContent);

