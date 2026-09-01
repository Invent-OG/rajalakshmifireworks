'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { use } from 'react';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { getNextStatuses } from '@/lib/services/order-status-machine';
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

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = parseInt(id);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.orders.detail(orderId),
    queryFn: () => fetch(`/api/admin/orders/${orderId}`).then((r) => r.json()),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ newStatus, note }: { newStatus: string; note?: string }) => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Order status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  const order = data?.order;
  if (!order) {
    return (
      <div className="text-center py-16 bg-card rounded-3xl border border-border">
        <p className="font-bold text-lg">Order Not Found</p>
        <Link href="/admin/orders" className="text-xs text-primary hover:underline mt-2 block">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const currentStatus = order.orderStatus as OrderStatus;
  const fulfillmentType = order.fulfillmentType as FulfillmentType;
  const nextStatuses = getNextStatuses(currentStatus, fulfillmentType);
  const address = order.addressSnapshot as {
    address: string;
    city: string;
    pincode: string;
  } | null;

  const statusIcons: Record<string, typeof Clock> = {
    PENDING: Clock,
    CONFIRMED: CheckCircle2,
    PROCESSING: Package,
    READY: Package,
    READY_FOR_PICKUP: Package,
    OUT_FOR_DELIVERY: Truck,
    COMPLETED: CheckCircle2,
    CANCELLED: XCircle,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border/80 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-mono font-black text-foreground">
                {order.invoiceNumber}
              </h1>
              <StatusBadge status={currentStatus} className="text-xs px-2.5 py-0.5" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Placed on {formatDateTime(order.placedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-card border border-border text-foreground">
            {fulfillmentType === 'DELIVERY' ? '🚚 Doorstep Delivery' : '🏪 Sivakasi Counter Pickup'}
          </span>
        </div>
      </div>

      {/* Main 2-Column Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customer & Items Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Details Card */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-4">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold">Customer Name</p>
                  <p className="font-bold text-foreground">{order.customerNameSnapshot}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold">Contact Mobile</p>
                  <p className="font-mono font-bold text-foreground">
                    {order.customerMobileSnapshot}
                  </p>
                </div>
              </div>

              {address && (
                <div className="sm:col-span-2 flex items-start gap-3 pt-2">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px] font-semibold">Delivery Address</p>
                    <p className="font-medium text-foreground">
                      {address.address}, {address.city} - {address.pincode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ordered Fireworks Items Card */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-4">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
              Ordered Items ({order.items?.length ?? 0})
            </h2>

            <div className="divide-y divide-border/60">
              {order.items.map((item: OrderItemDetail) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">{item.productNameSnapshot}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(toNumber(item.sellingPriceSnapshot))} × {item.quantity}
                      {toNumber(item.mrpSnapshot) > toNumber(item.sellingPriceSnapshot) && (
                        <span className="ml-2 line-through opacity-70">
                          {formatCurrency(toNumber(item.mrpSnapshot))}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-black text-foreground">
                    {formatCurrency(toNumber(item.lineTotal))}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-border/80 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(toNumber(order.subtotal))}</span>
              </div>
              {toNumber(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount Savings</span>
                  <span>-{formatCurrency(toNumber(order.discountAmount))}</span>
                </div>
              )}
              {toNumber(order.deliveryCharge) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Charge</span>
                  <span>{formatCurrency(toNumber(order.deliveryCharge))}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base sm:text-lg pt-3 border-t border-border text-foreground">
                <span>Grand Total</span>
                <span className="gold-gradient-text">{formatCurrency(toNumber(order.totalAmount))}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-5 rounded-3xl bg-muted/40 border border-border/80 space-y-1 text-xs">
              <p className="font-bold uppercase tracking-wider text-muted-foreground">
                Customer Delivery Instructions
              </p>
              <p className="text-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Status Machine Timeline */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Machine Actions Card */}
          {nextStatuses.length > 0 && (
            <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-4">
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">
                Update Order Status
              </h2>

              <div className="space-y-2">
                {nextStatuses
                  .filter((s) => s !== 'CANCELLED')
                  .map((status) => (
                    <Button
                      key={status}
                      className="w-full justify-center font-bold"
                      variant="primary"
                      onClick={() => statusMutation.mutate({ newStatus: status })}
                      disabled={statusMutation.isPending}
                    >
                      Progress to {ORDER_STATUS_LABELS[status]}
                    </Button>
                  ))}

                {nextStatuses.includes('CANCELLED') && (
                  <Button
                    variant="destructive"
                    className="w-full justify-center font-semibold mt-2"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to cancel this order? Reserved inventory will be restored.'
                        )
                      ) {
                        statusMutation.mutate({
                          newStatus: 'CANCELLED',
                          note: 'Cancelled by store manager',
                        });
                      }
                    }}
                    disabled={statusMutation.isPending}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-4">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
              Audit Status Trail
            </h2>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {order.statusHistory?.map((entry: OrderStatusHistoryEntry, idx: number) => {
                const isLatest = idx === 0;
                const Icon = statusIcons[entry.newStatus] || Clock;
                return (
                  <div key={entry.id} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 h-6 w-6 rounded-full flex items-center justify-center border-2 border-card shadow-xs ${
                        isLatest
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>

                    <div className="space-y-0.5">
                      <p
                        className={`text-xs font-bold ${
                          isLatest ? 'text-primary' : 'text-foreground'
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
