'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { use, useState } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { ORDER_STATUS_LABELS } from '@/lib/constants/order-status';
import type { OrderStatus, FulfillmentType } from '@/db/schema';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Package,
  Printer,
  Car,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderItemDetail {
  id: number;
  productNameSnapshot: string;
  sellingPriceSnapshot: string | number;
  mrpSnapshot: string | number;
  quantity: number;
  lineTotal: string | number;
}

interface OrderStatusHistoryEntry {
  id: number;
  newStatus: string;
  note: string | null;
  createdAt: string;
  changedBy: string | null;
}

interface DeliveryAssignmentEntry {
  id: number;
  deliveryPartnerId: number;
  assignedBy: string | null;
  assignedAt: string;
  unassignedAt: string | null;
  status: string;
  deliveryPartner?: {
    name: string;
    mobileNumber: string;
    vehicleType?: string | null;
    vehicleNumber?: string | null;
  };
}

interface DeliveryPartnerItem {
  id: number;
  name: string;
  fullName?: string;
  mobileNumber: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  status: string;
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = parseInt(id);
  const queryClient = useQueryClient();

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  // Fetch Order
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.orders.detail(orderId),
    queryFn: () => fetch(`/api/admin/orders/${orderId}`).then((r) => r.json()),
  });

  // Fetch Active Delivery Partners (All active partners across India)
  const { data: deliveryPartners = [], isLoading: isPartnersLoading } = useQuery<DeliveryPartnerItem[]>({
    queryKey: queryKeys.admin.deliveryPartners.list({ status: 'ACTIVE' }),
    queryFn: async () => {
      const res = await fetch('/api/admin/delivery-partners?status=ACTIVE');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Status Progression Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ newStatus, note }: { newStatus: string; note?: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update order status');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Order status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Assign / Reassign Delivery Partner Mutation
  const assignDeliveryMutation = useMutation({
    mutationFn: async ({ partnerId, note }: { partnerId: number; note?: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPartnerId: partnerId, note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to assign delivery partner');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Delivery partner assigned successfully');
      setIsReassigning(false);
      setSelectedPartnerId('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const order = data?.order;
  if (!order) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <p className="font-semibold text-base">Order not found</p>
        <Link href="/admin/orders" className="text-xs text-brand hover:underline mt-2 block">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStatus = (order.orderStatus || 'NEW') as OrderStatus;
  const fulfillmentType = (order.fulfillmentType || 'DELIVERY') as FulfillmentType;
  const address = order.addressSnapshot as {
    deliveryStateName?: string;
    deliveryCityName?: string;
    deliveryAddress?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;

  const cityName = address?.deliveryCityName || address?.city || order.city?.name;
  const stateName = address?.deliveryStateName || address?.state || order.state?.name;
  const streetAddress = address?.deliveryAddress || address?.address;
  const assignedPartner = order.deliveryPartner;

  const statusIcons: Record<string, typeof Clock> = {
    NEW: Clock,
    CONFIRMED: CheckCircle2,
    ASSIGNED: Truck,
    OUT_FOR_DELIVERY: Truck,
    DELIVERED: CheckCircle2,
    CANCELLED: XCircle,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-mono font-bold text-foreground">
                {order.invoiceNumber}
              </h1>
              <StatusBadge status={currentStatus} className="text-xs px-2.5 py-0.5" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Placed on {formatDateTime(order.placedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/admin/orders/${order.id}/print`} target="_blank">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-medium">
              <Printer className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Print Slip
            </Button>
          </Link>
          <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-card border border-border text-foreground">
            {fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Sivakasi Counter Pickup'}
          </span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customer Details, Address, Ordered Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer & Delivery Address Card */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Customer & Delivery Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Customer Name</p>
                  <p className="font-semibold text-foreground">{order.customerNameSnapshot}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">WhatsApp / Contact Number</p>
                  <p className="font-mono font-semibold text-foreground">
                    {order.customerMobileSnapshot}
                  </p>
                </div>
              </div>

              {/* Delivery Address Details */}
              {fulfillmentType === 'DELIVERY' && address && (
                <div className="sm:col-span-2 flex items-start gap-3 pt-2 border-t border-border/60">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-brand" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-[11px] uppercase font-semibold">Delivery Address (Historical Snapshot)</p>
                    <p className="font-medium text-foreground">{streetAddress}</p>
                    <p className="text-xs text-foreground font-semibold">
                      {[cityName, stateName].filter(Boolean).join(', ')} {address.pincode ? `- ${address.pincode}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ordered Products Card */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Ordered Products ({order.items?.length ?? 0})
            </h2>

            <div className="divide-y divide-border">
              {order.items?.map((item: OrderItemDetail) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">{item.productNameSnapshot}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(toNumber(item.sellingPriceSnapshot))} × {item.quantity}
                      {toNumber(item.mrpSnapshot) > toNumber(item.sellingPriceSnapshot) && (
                        <span className="ml-2 line-through opacity-70">
                          {formatCurrency(toNumber(item.mrpSnapshot))}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground font-mono">
                    {formatCurrency(toNumber(item.lineTotal))}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-border space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(toNumber(order.subtotal))}</span>
              </div>
              {toNumber(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Festival Discount</span>
                  <span className="font-mono">-{formatCurrency(toNumber(order.discountAmount))}</span>
                </div>
              )}
              {toNumber(order.deliveryCharge) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Charge</span>
                  <span className="font-mono">{formatCurrency(toNumber(order.deliveryCharge))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-foreground pt-2 border-t border-border">
                <span>Total Amount</span>
                <span className="font-mono">{formatCurrency(toNumber(order.totalAmount))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Actions & Delivery Assignment */}
        <div className="lg:col-span-4 space-y-6">
          {/* STEP 1: ORDER CONFIRMATION WORKFLOW */}
          {currentStatus === 'NEW' && (
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
                Order Action
              </h2>
              <p className="text-xs text-muted-foreground">
                Review this newly placed order and confirm it before delivery partner assignment.
              </p>
              <Button
                className="w-full justify-center font-bold"
                onClick={() => statusMutation.mutate({ newStatus: 'CONFIRMED' })}
                disabled={statusMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Confirm Order
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-center font-medium mt-2"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this order?')) {
                    statusMutation.mutate({ newStatus: 'CANCELLED', note: 'Cancelled by store admin' });
                  }
                }}
                disabled={statusMutation.isPending}
              >
                Cancel Order
              </Button>
            </div>
          )}

          {/* STEP 2: DELIVERY PARTNER ASSIGNMENT (When CONFIRMED or reassigning) */}
          {fulfillmentType === 'DELIVERY' && (currentStatus === 'CONFIRMED' || isReassigning) && (
            <div className="p-6 rounded-2xl bg-card border-2 border-brand/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-brand" />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    {isReassigning ? 'Reassign Delivery Partner' : 'Assign Delivery Partner'}
                  </h2>
                </div>
                {isReassigning && (
                  <button
                    onClick={() => setIsReassigning(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Select an active delivery personnel to fulfill this shipment across India:
              </p>

              {deliveryPartners.length > 0 ? (
                <div className="space-y-3">
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer shadow-xs"
                  >
                    <option value="">-- Select Active Delivery Partner --</option>
                    {deliveryPartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.fullName} ({p.mobileNumber}) {p.vehicleType ? `• ${p.vehicleType}` : ''}
                      </option>
                    ))}
                  </select>

                  <Button
                    className="w-full justify-center font-bold"
                    disabled={!selectedPartnerId || assignDeliveryMutation.isPending}
                    onClick={() => {
                      if (!selectedPartnerId) return;
                      assignDeliveryMutation.mutate({ partnerId: Number(selectedPartnerId) });
                    }}
                  >
                    <Truck className="h-4 w-4 mr-1.5" />
                    {assignDeliveryMutation.isPending ? 'Assigning...' : 'Assign Delivery'}
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                  <p className="font-semibold">No active delivery partners available.</p>
                  <p className="text-[11px]">Please add or activate a delivery partner before assigning this order.</p>
                  <Link href="/admin/delivery-partners" className="inline-block font-bold underline">
                    Go to Delivery Partners →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: ASSIGNED / OUT FOR DELIVERY / DELIVERED DETAILS */}
          {assignedPartner && !isReassigning && (
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-brand" />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Assigned Delivery Partner
                  </h2>
                </div>
                {(currentStatus === 'ASSIGNED' || currentStatus === 'CONFIRMED') && (
                  <button
                    onClick={() => setIsReassigning(true)}
                    className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" /> Change
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground text-sm">{assignedPartner.name || assignedPartner.fullName}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-2 text-foreground font-mono font-semibold">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {assignedPartner.mobileNumber}
                </div>

                {(assignedPartner.vehicleType || assignedPartner.vehicleNumber) && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{assignedPartner.vehicleType || 'Vehicle'}</span>
                    {assignedPartner.vehicleNumber && <span className="font-mono uppercase font-medium text-foreground">({assignedPartner.vehicleNumber})</span>}
                  </div>
                )}

                {order.assignedAt && (
                  <div className="text-[10px] text-muted-foreground pt-1 border-t border-border flex items-center justify-between">
                    <span>Assigned Date:</span>
                    <span className="font-medium text-foreground">{formatDateTime(order.assignedAt)}</span>
                  </div>
                )}

                {order.assignedBy && (
                  <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                    <span>Assigned By:</span>
                    <span className="font-medium text-foreground">{order.assignedBy}</span>
                  </div>
                )}
              </div>

              {/* Status Actions for Assigned Orders */}
              {currentStatus === 'ASSIGNED' && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Button
                    className="w-full justify-center font-bold"
                    onClick={() => statusMutation.mutate({ newStatus: 'OUT_FOR_DELIVERY' })}
                    disabled={statusMutation.isPending}
                  >
                    <Truck className="h-4 w-4 mr-1.5" /> Mark Out for Delivery
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full justify-center font-medium"
                    onClick={() => {
                      if (confirm('Cancel this assigned order?')) {
                        statusMutation.mutate({ newStatus: 'CANCELLED', note: 'Cancelled by admin' });
                      }
                    }}
                    disabled={statusMutation.isPending}
                  >
                    Cancel Order
                  </Button>
                </div>
              )}

              {/* Status Actions for Out for Delivery */}
              {currentStatus === 'OUT_FOR_DELIVERY' && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Button
                    className="w-full justify-center font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => statusMutation.mutate({ newStatus: 'DELIVERED' })}
                    disabled={statusMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Delivered
                  </Button>
                </div>
              )}

              {/* Status Actions for Delivered */}
              {currentStatus === 'DELIVERED' && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Order Delivered Successfully
                </div>
              )}
            </div>
          )}

          {/* Cancellation View */}
          {currentStatus === 'CANCELLED' && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs space-y-1">
              <p className="font-bold text-destructive flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> Order Cancelled
              </p>
              <p className="text-muted-foreground">Reserved inventory was restored back to stock.</p>
            </div>
          )}

          {/* Order Status History Timeline */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Audit Trail
            </h2>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {order.statusHistory?.map((entry: OrderStatusHistoryEntry, idx: number) => {
                const isLatest = idx === 0;
                const Icon = statusIcons[entry.newStatus] || Clock;
                return (
                  <div key={entry.id} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 border-card ${
                        isLatest
                          ? 'bg-foreground text-background ring-2 ring-foreground/10'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-2.5 w-2.5" />
                    </div>

                    <div className="space-y-0.5">
                      <p
                        className={`text-xs font-semibold ${
                          isLatest ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {ORDER_STATUS_LABELS[entry.newStatus as OrderStatus] || entry.newStatus}
                      </p>
                      {entry.note && (
                        <p className="text-[11px] text-muted-foreground leading-snug">{entry.note}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateTime(entry.createdAt)} {entry.changedBy ? `• ${entry.changedBy}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
