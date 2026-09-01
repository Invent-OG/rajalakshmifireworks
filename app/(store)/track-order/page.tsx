'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderTrackingSchema, type OrderTrackingInput } from '@/lib/validation/order';
import { StoreButton } from '@/components/ui/store-button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { Search, Package, CheckCircle2, Clock, Truck } from 'lucide-react';

interface TrackedOrder {
  invoiceNumber: string;
  orderStatus: string;
  fulfillmentType: string;
  subtotal: string;
  totalAmount: string;
  customerName: string;
  placedAt: string;
  items: Array<{ productName: string; quantity: number; sellingPrice: string; lineTotal: string }>;
  statusHistory: Array<{ status: string; note: string | null; createdAt: string }>;
}

const statusIcons: Record<string, typeof Clock> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  PROCESSING: Package,
  READY: Package,
  READY_FOR_PICKUP: Package,
  OUT_FOR_DELIVERY: Truck,
  COMPLETED: CheckCircle2,
};

export default function TrackOrderPage() {
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const form = useForm<OrderTrackingInput>({
    resolver: zodResolver(orderTrackingSchema),
    defaultValues: { mobile: '', invoiceNumber: '' },
  });

  async function onSubmit(data: OrderTrackingInput) {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setOrders(result.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
          Enter your 10-digit mobile number to view active order updates and status history.
        </p>
      </div>

      {/* Search Input Card */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mobile Number *"
            placeholder="10-digit mobile number"
            error={form.formState.errors.mobile?.message}
            {...form.register('mobile')}
          />
          <Input
            label="Invoice Number (Optional)"
            placeholder="e.g. FW-20260830-0001"
            {...form.register('invoiceNumber')}
          />
        </div>

        <StoreButton
          type="submit"
          size="lg"
          variant="primary"
          loading={loading}
          className="w-full"
        >
          <Search className="h-4 w-4" />
          Track Order
        </StoreButton>
      </form>

      {/* Empty / Not Found State */}
      {searched && orders.length === 0 && !loading && (
        <EmptyState
          icon={Package}
          title="No orders found"
          description="We couldn't locate any orders matching this mobile number. Please verify the number and try again."
        />
      )}

      {/* Order Cards List */}
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.invoiceNumber}
            className="p-6 sm:p-7 rounded-2xl bg-card border border-border space-y-6 animate-scale-in"
          >
            {/* Top Order Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
              <div>
                <span className="text-xs uppercase font-medium text-muted-foreground tracking-wider">
                  Invoice Number
                </span>
                <p className="font-mono font-bold text-lg text-foreground">
                  {order.invoiceNumber}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Placed on {formatDateTime(order.placedAt)}
                </p>
              </div>

              <div className="self-start sm:self-center">
                <StatusBadge status={order.orderStatus} className="text-xs py-1 px-3" />
              </div>
            </div>

            {/* Items Summary */}
            <div>
              <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-3">
                Items ({order.items.length})
              </h4>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-foreground font-medium">
                      {item.productName} <span className="text-muted-foreground font-normal">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(toNumber(item.lineTotal))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Row */}
            <div className="pt-3 border-t border-border flex justify-between items-baseline">
              <span className="font-medium text-sm text-foreground">Total Payable</span>
              <span className="font-bold text-base text-foreground">
                {formatCurrency(toNumber(order.totalAmount))}
              </span>
            </div>

            {/* Status Machine Timeline */}
            {order.statusHistory.length > 0 && (
              <div className="pt-4 border-t border-border space-y-4">
                <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  Fulfillment Timeline
                </h4>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {order.statusHistory.map((entry, idx) => {
                    const isLatest = idx === 0;
                    const Icon = statusIcons[entry.status] || Clock;
                    return (
                      <div key={idx} className="relative flex items-start gap-3">
                        {/* Milestone dot */}
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
                            {entry.status.replace(/_/g, ' ')}
                          </p>
                          {entry.note && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {entry.note}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
