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
  MessageSquare,
  RefreshCw,
  Check,
  CheckCheck,
  AlertCircle,
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

interface WhatsAppMessageEntry {
  id: number;
  messageType: string;
  templateName: string;
  providerMessageId: string | null;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  errorCode: string | null;
  errorMessage: string | null;
  attemptCount: number;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
  createdAt: string;
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

  const whatsAppRetryMutation = useMutation({
    mutationFn: async (messageId?: number) => {
      const res = await fetch(`/api/admin/orders/${orderId}/whatsapp/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to retry WhatsApp message');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.detail(orderId) });
      toast.success('WhatsApp notification dispatched successfully');
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-card border border-border text-foreground">
            {fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Sivakasi Counter Pickup'}
          </span>
        </div>
      </div>

      {/* Main 2-Column Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customer & Items Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Details Card */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Customer Name</p>
                  <p className="font-medium text-foreground">{order.customerNameSnapshot}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[11px]">Mobile Number</p>
                  <p className="font-mono font-medium text-foreground">
                    {order.customerMobileSnapshot}
                  </p>
                </div>
              </div>

              {address && (
                <div className="sm:col-span-2 flex items-start gap-3 pt-2">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px]">Delivery Address</p>
                    <p className="font-normal text-foreground">
                      {address.address}, {address.city} - {address.pincode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ordered Fireworks Items Card */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Ordered Items ({order.items?.length ?? 0})
            </h2>

            <div className="divide-y divide-border">
              {order.items.map((item: OrderItemDetail) => (
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
                  <span className="font-semibold text-foreground">
                    {formatCurrency(toNumber(item.lineTotal))}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-border space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(toNumber(order.subtotal))}</span>
              </div>
              {toNumber(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount</span>
                  <span>-{formatCurrency(toNumber(order.discountAmount))}</span>
                </div>
              )}
              {toNumber(order.deliveryCharge) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatCurrency(toNumber(order.deliveryCharge))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-3 border-t border-border text-foreground">
                <span>Grand Total</span>
                <span>{formatCurrency(toNumber(order.totalAmount))}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1 text-xs">
              <p className="font-semibold uppercase tracking-wider text-muted-foreground">
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
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Update Status
              </h2>

              <div className="space-y-2">
                {nextStatuses
                  .filter((s) => s !== 'CANCELLED')
                  .map((status) => (
                    <Button
                      key={status}
                      className="w-full justify-center font-medium"
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
                    className="w-full justify-center font-medium mt-2"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to cancel this order? Reserved stock will be restored.'
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

          {/* WhatsApp Cloud API Notification Card */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <h2 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                  WhatsApp Updates
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 rounded-lg"
                onClick={() => whatsAppRetryMutation.mutate(undefined)}
                disabled={whatsAppRetryMutation.isPending}
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${
                    whatsAppRetryMutation.isPending ? 'animate-spin' : ''
                  }`}
                />
                Resend
              </Button>
            </div>

            {order.whatsappMessages && order.whatsappMessages.length > 0 ? (
              <div className="space-y-3">
                {order.whatsappMessages.map((msg: WhatsAppMessageEntry) => {
                  const statusColors: Record<string, string> = {
                    SENT: 'bg-blue-50 text-blue-700 border-blue-200',
                    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    READ: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    FAILED: 'bg-red-50 text-red-700 border-red-200',
                  };

                  const StatusIcon =
                    msg.status === 'READ'
                      ? CheckCheck
                      : msg.status === 'DELIVERED' || msg.status === 'SENT'
                      ? Check
                      : msg.status === 'FAILED'
                      ? AlertCircle
                      : Clock;

                  const readableType = msg.messageType
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase());

                  return (
                    <div
                      key={msg.id}
                      className="p-3 rounded-xl bg-background-secondary border border-border/70 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{readableType}</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            statusColors[msg.status] || 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <StatusIcon className="h-2.5 w-2.5" />
                          {msg.status}
                        </span>
                      </div>

                      {msg.errorMessage && (
                        <p className="text-[11px] text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-100 font-mono">
                          {msg.errorMessage}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <span>
                          {msg.sentAt
                            ? `Sent: ${formatDateTime(msg.sentAt)}`
                            : `Logged: ${formatDateTime(msg.createdAt)}`}
                        </span>
                        {msg.status === 'FAILED' && (
                          <button
                            onClick={() => whatsAppRetryMutation.mutate(msg.id)}
                            disabled={whatsAppRetryMutation.isPending}
                            className="text-brand hover:underline font-medium ml-2"
                          >
                            Retry this
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                <p>No WhatsApp notifications recorded for this order.</p>
              </div>
            )}
          </div>

          {/* Audit History Timeline */}
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
