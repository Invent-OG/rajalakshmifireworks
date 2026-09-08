'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart } from '@/hooks/use-cart';
import { StoreButton } from '@/components/ui/store-button';
import { Input, Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils/format';
import { Truck, Store, ShoppingBag, ShieldCheck, MessageSquare, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

const checkoutFormSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(255),
    mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
    address: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.fulfillmentType === 'DELIVERY') {
        return (
          data.address &&
          data.address.length >= 5 &&
          data.city &&
          data.city.length >= 2 &&
          data.pincode &&
          /^\d{6}$/.test(data.pincode)
        );
      }
      return true;
    },
    {
      message: 'Address, city, and 6-digit pincode are required for delivery',
      path: ['address'],
    }
  );

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalSavings, itemCount, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: '',
      mobile: '',
      fulfillmentType: 'DELIVERY',
      address: '',
      city: '',
      pincode: '',
      notes: '',
    },
  });

  const fulfillmentType = useWatch({
    control: form.control,
    name: 'fulfillmentType',
    defaultValue: 'DELIVERY',
  });

  if (items.length === 0) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your shopping bag is empty"
          description="Please add items to your cart before proceeding to checkout."
          actionLabel="Browse fireworks"
          actionHref="/products"
        />
      </div>
    );
  }

  async function onSubmit(data: CheckoutFormData) {
    setSubmitting(true);
    try {
      const idempotencyKey = nanoid();

      const payload = {
        customer: {
          name: data.name,
          mobile: data.mobile,
        },
        fulfillmentType: data.fulfillmentType,
        address:
          data.fulfillmentType === 'DELIVERY'
            ? {
                address: data.address!,
                city: data.city!,
                pincode: data.pincode!,
              }
            : undefined,
        notes: data.notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        idempotencyKey,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || 'Failed to place order. Please try again.');
        return;
      }

      clearCart();
      router.push(`/order-confirmation/${result.order.invoiceNumber}`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Checkout
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Review your items and complete your order information
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Numbered Step Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 01: Customer Details */}
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  01
                </span>
                <h2 className="font-bold text-base text-foreground tracking-tight">
                  Customer Details
                </h2>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Rajesh Kumar"
                  error={form.formState.errors.name?.message}
                  {...form.register('name')}
                />
                <Input
                  label="Mobile Number (WhatsApp) *"
                  placeholder="10-digit mobile number"
                  error={form.formState.errors.mobile?.message}
                  {...form.register('mobile')}
                />
              </div>
            </div>

            {/* Step 02: Fulfillment Method */}
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  02
                </span>
                <h2 className="font-bold text-base text-foreground tracking-tight">
                  Fulfillment
                </h2>
              </div>

              {/* Selectable Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label
                  className={`p-4 rounded-[22px] sm:rounded-[24px] border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    fulfillmentType === 'DELIVERY'
                      ? 'border-brand bg-brand-light/30 shadow-xs'
                      : 'border-neutral-200/80 hover:border-neutral-400 bg-neutral-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    value="DELIVERY"
                    className="sr-only"
                    {...form.register('fulfillmentType')}
                  />
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      fulfillmentType === 'DELIVERY'
                        ? 'bg-brand text-white'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    <Truck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Home Delivery</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Direct transport to your address
                    </p>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-[22px] sm:rounded-[24px] border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    fulfillmentType === 'PICKUP'
                      ? 'border-brand bg-brand-light/30 shadow-xs'
                      : 'border-neutral-200/80 hover:border-neutral-400 bg-neutral-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    value="PICKUP"
                    className="sr-only"
                    {...form.register('fulfillmentType')}
                  />
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      fulfillmentType === 'PICKUP'
                        ? 'bg-brand text-white'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    <Store className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Store Pickup</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Collect at Sivakasi counter
                    </p>
                  </div>
                </label>
              </div>

              {/* Delivery Address Fields */}
              {fulfillmentType === 'DELIVERY' && (
                <div className="space-y-4 pt-2 animate-fade-in">
                  <Input
                    label="Street Address *"
                    placeholder="e.g. 14/2B Gandhi Street, Near Main Market"
                    error={form.formState.errors.address?.message}
                    {...form.register('address')}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="City / Town *"
                      placeholder="e.g. Madurai"
                      error={form.formState.errors.city?.message}
                      {...form.register('city')}
                    />
                    <Input
                      label="Pincode *"
                      placeholder="6-digit pincode"
                      error={form.formState.errors.pincode?.message}
                      {...form.register('pincode')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 03: Delivery Instructions */}
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  03
                </span>
                <h2 className="font-bold text-base text-foreground tracking-tight">
                  Special Notes (Optional)
                </h2>
              </div>
              <Textarea
                placeholder="Any specific packing instructions or delivery timings?"
                {...form.register('notes')}
              />
            </div>
          </div>

          {/* Right: Order Summary Breakdown */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white sticky top-24 space-y-6 shadow-sm">
              <h2 className="font-bold text-base text-foreground tracking-tight pb-3 border-b border-neutral-100">
                Review Order ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-foreground font-medium truncate max-w-[65%]">
                      {item.name} <span className="text-muted-foreground font-normal">× {item.quantity}</span>
                    </span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(item.sellingPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="border-t border-neutral-100 pt-4 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Wholesale discount</span>
                    <span>-{formatCurrency(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Fulfillment</span>
                  <span>{fulfillmentType === 'DELIVERY' ? 'Doorstep transport' : 'Store pickup (Free)'}</span>
                </div>
              </div>

              {/* Total Box */}
              <div className="border-t border-neutral-100 pt-4 flex items-baseline justify-between">
                <span className="font-bold text-base text-foreground">Total Payable</span>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* Submit CTA */}
              <StoreButton
                type="submit"
                size="lg"
                variant="primary"
                loading={submitting}
                disabled={submitting}
                className="w-full"
              >
                Confirm & Place Order
                <ArrowRight className="h-4 w-4" />
              </StoreButton>

              {/* WhatsApp Notice Box */}
              <div className="p-4 rounded-[20px] sm:rounded-[22px] bg-neutral-50 text-xs text-muted-foreground flex items-start gap-3">
                <MessageSquare className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                <p className="leading-relaxed">
                  <strong>No online payment required.</strong> Once placed, you will receive an official invoice on WhatsApp to verify and confirm.
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span>100% Secure Sivakasi Factory Direct</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
