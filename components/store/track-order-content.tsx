'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { orderTrackingSchema, type OrderTrackingInput } from '@/lib/validation/order';
import { StoreButton } from '@/components/ui/store-button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/utils/format';
import { Search, Package, CheckCircle2, Clock, Truck, Store } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap, isReducedMotion } from '@/lib/motion';
import { useTranslations, useLocale } from '@/lib/i18n/context';

interface TrackedOrder {
  invoiceNumber: string;
  orderStatus: string;
  fulfillmentType: string;
  subtotal: string;
  totalAmount: string;
  customerName: string;
  placedAt: string;
  lrNumber?: string | null;
  carriageDetails?: string | null;
  lrCopyUrl?: string | null;
  packageCount?: number | null;
  items: Array<{ productName: string; quantity: number; sellingPrice: string; lineTotal: string }>;
  statusHistory: Array<{ status: string; note: string | null; createdAt: string }>;
}

const statusIcons: Record<string, typeof Clock> = {
  NEW: Clock,
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  PROCESSING: Package,
  PACKED: Package,
  ASSIGNED: Truck,
  OUT_FOR_DELIVERY: Truck,
  READY_FOR_PICKUP: Store,
  PICKED_UP: CheckCircle2,
  DELIVERED: CheckCircle2,
  COMPLETED: CheckCircle2,
  CANCELLED: Clock,
};

function getFulfillmentMilestones(fulfillmentType: string, currentStatus: string) {
  if (currentStatus === 'CANCELLED') {
    return [
      { key: 'NEW', label: 'Order Placed', icon: Clock, isCompleted: true, isCurrent: false },
      { key: 'CANCELLED', label: 'Order Cancelled', icon: Clock, isCompleted: true, isCurrent: true },
    ];
  }

  if (fulfillmentType === 'PICKUP') {
    const steps = [
      { key: 'NEW', label: 'Placed', icon: Clock },
      { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
      { key: 'PACKED', label: 'Packed', icon: Package },
      { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: Store },
      { key: 'PICKED_UP', label: 'Picked Up', icon: CheckCircle2 },
      { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
    ];

    const orderRanks: Record<string, number> = {
      NEW: 0,
      CONFIRMED: 1,
      PROCESSING: 1,
      PACKED: 2,
      READY_FOR_PICKUP: 3,
      PICKED_UP: 4,
      DELIVERED: 4,
      COMPLETED: 5,
    };

    const currentRank = orderRanks[currentStatus] ?? 0;

    return steps.map((s, idx) => ({
      ...s,
      isCompleted: idx < currentRank,
      isCurrent: idx === currentRank,
    }));
  }

  const steps = [
    { key: 'NEW', label: 'Placed', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'PACKED', label: 'Packed', icon: Package },
    { key: 'OUT_FOR_DELIVERY', label: 'Dispatched', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  ];

  const orderRanks: Record<string, number> = {
    NEW: 0,
    CONFIRMED: 1,
    PROCESSING: 1,
    PACKED: 2,
    ASSIGNED: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
    COMPLETED: 5,
  };

  const currentRank = orderRanks[currentStatus] ?? 0;

  return steps.map((s, idx) => ({
    ...s,
    isCompleted: idx < currentRank,
    isCurrent: idx === currentRank,
  }));
}

import { Providers } from '@/components/providers';

function TrackOrderPageContent() {
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [searched, setSearched] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('trackOrder');
  const tCart = useTranslations('cart');
  const locale = useLocale();

  useGSAP(
    () => {
      if (isReducedMotion() || !resultsContainerRef.current || orders.length === 0) return;

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(
        '.order-card-reveal',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }
      ).fromTo(
        '.timeline-node-reveal',
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.05 },
        '-=0.2'
      );
    },
    { dependencies: [orders], scope: resultsContainerRef }
  );

  const form = useForm<OrderTrackingInput>({
    resolver: zodResolver(orderTrackingSchema),
    defaultValues: { mobile: '', invoiceNumber: '' },
  });

  const trackOrderMutation = useMutation({
    mutationFn: async (data: OrderTrackingInput) => {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to track order');
      return res.json() as Promise<{ orders: TrackedOrder[] }>;
    },
    onSuccess: (result) => {
      setOrders(result?.orders || []);
      setSearched(true);
    },
    onError: () => {
      setOrders([]);
      setSearched(true);
    },
  });

  const loading = trackOrderMutation.isPending;

  function onSubmit(data: OrderTrackingInput) {
    trackOrderMutation.mutate(data);
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 animate-fade-in space-y-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-heading">
            {t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Search Input Card */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#141414] dark:border dark:border-[#282828] space-y-4 shadow-sm dark:shadow-none"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t('phone')} *`}
              placeholder={t('phonePlaceholder')}
              error={form.formState.errors.mobile?.message}
              {...form.register('mobile')}
            />
            <Input
              label={`${t('orderId')} (Optional)`}
              placeholder={t('orderIdPlaceholder')}
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
            {t('btnTrack')}
          </StoreButton>
        </form>

        {/* Empty / Not Found State */}
        {searched && orders.length === 0 && !loading && (
          <EmptyState
            icon={Package}
            title={locale === 'ta' ? 'முன்பதிவு விவரங்கள் கிடைக்கவில்லை' : 'No orders found'}
            description={
              locale === 'ta'
                ? 'இந்த மொபைல் எண்ணிற்கு எந்த முன்பதிவும் காணப்படவில்லை. எண்களைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
                : "We couldn't locate any orders matching this mobile number. Please verify the number and try again."
            }
          />
        )}

        {/* Order Cards List */}
        <div ref={resultsContainerRef} className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.invoiceNumber}
              className="order-card-reveal p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#141414] dark:border dark:border-[#282828] space-y-6 shadow-sm dark:shadow-none"
            >
              {/* Top Order Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#282828] gap-3">
                <div>
                  <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                    {t('orderId')}
                  </span>
                  <p className="font-mono font-bold text-lg text-foreground">
                    {order.invoiceNumber}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('bookingDate')}: {formatDateTime(order.placedAt)}
                  </p>
                </div>

                <div className="self-start sm:self-center">
                  <StatusBadge status={order.orderStatus} className="text-xs py-1 px-3.5" />
                </div>
              </div>

              {/* Lorry Receipt (LR) & Carriage Details Card */}
              {(order.lrNumber || order.carriageDetails) && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <Truck className="h-4 w-4" /> Lorry Receipt (LR / Carriage Details)
                  </div>
                  {order.lrNumber && (
                    <p className="text-sm font-mono font-bold text-foreground">
                      LR Number: <span className="text-brand font-extrabold">{order.lrNumber}</span>
                    </p>
                  )}
                  {order.carriageDetails && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Carriage / Transport: <span className="text-foreground font-medium">{order.carriageDetails}</span>
                    </p>
                  )}
                  {order.packageCount && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Total Consignment: <span className="text-foreground font-semibold">{order.packageCount} {Number(order.packageCount) === 1 ? 'Case / Box' : 'Cases / Boxes'}</span>
                    </p>
                  )}
                  {order.lrCopyUrl && (
                    <a
                      href={order.lrCopyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline pt-1"
                    >
                      View Lorry Receipt Copy &rarr;
                    </a>
                  )}
                </div>
              )}

              {/* Items Summary */}
              <div>
                <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-3">
                  {t('itemsOrdered')} ({order.items.length})
                </h4>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-foreground font-medium">
                        {item.productName} <span className="text-muted-foreground font-normal font-mono">× {item.quantity}</span>
                      </span>
                      <span className="font-semibold text-foreground font-mono">
                        {formatCurrency(toNumber(item.lineTotal))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="font-medium text-sm text-foreground">{tCart('estimatedTotal')}</span>
                <span className="font-bold text-base text-foreground font-mono">
                  {formatCurrency(toNumber(order.totalAmount))}
                </span>
              </div>

              {/* Visual Milestone Stepper (Fulfillment Pipeline) */}
              {(() => {
                const milestones = getFulfillmentMilestones(order.fulfillmentType, order.orderStatus);
                return (
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                        {order.fulfillmentType === 'PICKUP' ? 'Store Pickup Journey' : 'Doorstep Delivery Journey'}
                      </h4>
                      <span className="text-[11px] font-medium text-muted-foreground font-mono">
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {milestones.map((m, mIdx) => {
                        const MIcon = m.icon;
                        const isDone = m.isCompleted;
                        const isCurrent = m.isCurrent;
                        return (
                          <div
                            key={mIdx}
                            className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                              isCurrent
                                ? 'bg-brand/10 border-brand text-brand font-bold shadow-2xs'
                                : isDone
                                ? 'bg-muted/60 border-border text-foreground font-medium'
                                : 'bg-muted/20 border-border/40 text-muted-foreground/50 opacity-60'
                            }`}
                          >
                            <div
                              className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
                                isCurrent
                                  ? 'bg-brand text-brand-foreground ring-2 ring-brand/20'
                                  : isDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <MIcon className="h-2.5 w-2.5" />
                            </div>
                            <span className="text-[11px] truncate leading-tight">{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Status Machine Timeline */}
              {order.statusHistory.length > 0 && (
                <div className="pt-4 border-t border-border space-y-4">
                  <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                    {t('currentStatus')}
                  </h4>

                  <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                    {order.statusHistory.map((entry, idx) => {
                      const isLatest = idx === 0;
                      const Icon = statusIcons[entry.status] || Clock;
                      return (
                        <div key={idx} className="timeline-node-reveal relative flex items-start gap-3">
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
    </div>
  );
}

export default function TrackOrderPage({ locale }: { locale?: string } = {}) {
  return (
    <Providers locale={locale}>
      <TrackOrderPageContent />
    </Providers>
  );
}

