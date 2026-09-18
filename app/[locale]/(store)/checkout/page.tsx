'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/hooks/use-cart';
import { StoreButton } from '@/components/ui/store-button';
import { Input, Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { EnquiryNoticeModal } from '@/components/store/enquiry-notice-modal';
import { formatCurrency } from '@/lib/utils/format';
import { Truck, Store, ShoppingBag, ShieldCheck, MessageSquare, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { getLocalizedName } from '@/lib/i18n/formatters';
import { queryKeys } from '@/lib/query/keys';

interface StateOption {
  id: number;
  name: string;
  code?: string | null;
}

interface CityOption {
  id: number;
  name: string;
  stateId: number;
}

const checkoutFormSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(255),
    mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
    stateId: z.string().optional(),
    cityId: z.string().optional(),
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
          data.address.trim().length >= 5 &&
          data.stateId &&
          Number(data.stateId) > 0 &&
          data.cityId &&
          Number(data.cityId) > 0 &&
          data.pincode &&
          /^\d{6}$/.test(data.pincode.trim())
        );
      }
      return true;
    },
    {
      message: 'Complete delivery address, state, city, and 6-digit pincode are required',
      path: ['address'],
    }
  );

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalSavings, itemCount, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CheckoutFormData | null>(null);

  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const tToasts = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const locale = useLocale();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: '',
      mobile: '',
      fulfillmentType: 'DELIVERY',
      stateId: '',
      cityId: '',
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

  const selectedStateId = useWatch({
    control: form.control,
    name: 'stateId',
  });

  // Fetch Public Active States
  const { data: states = [], isLoading: isStatesLoading } = useQuery<StateOption[]>({
    queryKey: queryKeys.locations?.states?.() || ['locations', 'states'],
    queryFn: async () => {
      const res = await fetch('/api/states');
      if (!res.ok) throw new Error('Failed to load states');
      return res.json();
    },
  });

  // Fetch Cities dependent on selected state
  const { data: cities = [], isLoading: isCitiesLoading } = useQuery<CityOption[]>({
    queryKey: queryKeys.locations?.cities?.(selectedStateId || '') || ['locations', 'cities', selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const res = await fetch(`/api/states/${selectedStateId}/cities`);
      if (!res.ok) throw new Error('Failed to load cities');
      return res.json();
    },
    enabled: !!selectedStateId,
  });

  // When state changes, reset cityId and city name in form
  useEffect(() => {
    if (selectedStateId) {
      form.setValue('cityId', '');
      form.setValue('city', '');
    }
  }, [selectedStateId, form]);

  const getHref = (path: string) => (locale === 'en' ? path : `/${locale}${path}`);

  if (items.length === 0) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-16 font-sans">
        <EmptyState
          icon={ShoppingBag}
          title={tCart('emptyTitle')}
          description={tCart('emptyDesc')}
          actionLabel={tCart('browseProducts')}
          actionHref={getHref('/products')}
        />
      </div>
    );
  }

  function handleFormSubmit(data: CheckoutFormData) {
    setPendingFormData(data);
    setShowNoticeModal(true);
  }

  async function executeBooking(data: CheckoutFormData) {
    setSubmitting(true);
    try {
      const idempotencyKey = nanoid();
      const selectedState = states.find((s) => s.id === Number(data.stateId));
      const selectedCity = cities.find((c) => c.id === Number(data.cityId));

      const payload = {
        customer: {
          name: data.name.trim(),
          mobile: data.mobile.trim(),
        },
        fulfillmentType: data.fulfillmentType,
        address:
          data.fulfillmentType === 'DELIVERY'
            ? {
                address: data.address!.trim(),
                stateId: Number(data.stateId),
                cityId: Number(data.cityId),
                state: selectedState?.name || '',
                city: selectedCity?.name || data.city || '',
                pincode: data.pincode!.trim(),
              }
            : undefined,
        notes: data.notes?.trim() || undefined,
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
        throw new Error(result.message || 'Failed to place order');
      }

      // Clear local cart
      clearCart();

      // Show success
      toast.success(
        locale === 'ta'
          ? 'உங்கள் தீபாவளி பட்டாசு விசாரணை வெற்றிகரமாக பதிவானது!'
          : 'Your Diwali fireworks enquiry has been placed successfully!'
      );

      // Redirect to Confirmation Page
      router.push(getHref(`/order-confirmation/${result.orderId}`));
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
      setShowNoticeModal(false);
    }
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-12 font-sans max-w-7xl mx-auto animate-fade-in">
      {/* Checkout Form Head */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Input Details Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 01: Customer Details */}
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-1 border-b border-neutral-100">
                <span className="h-7 w-7 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shadow-xs font-mono">
                  01
                </span>
                <h2 className="font-bold text-base text-foreground tracking-tight font-heading">
                  {t('personalDetails')}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`${t('fullName')} *`}
                  placeholder={t('fullNamePlaceholder')}
                  error={form.formState.errors.name?.message}
                  {...form.register('name')}
                />
                <Input
                  label={`${t('mobileNumber')} *`}
                  placeholder={t('mobilePlaceholder')}
                  error={form.formState.errors.mobile?.message}
                  {...form.register('mobile')}
                />
              </div>
            </div>

            {/* Step 02: Fulfillment Mode & Address Selection */}
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-1 border-b border-neutral-100">
                <span className="h-7 w-7 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shadow-xs font-mono">
                  02
                </span>
                <h2 className="font-bold text-base text-foreground tracking-tight font-heading">
                  {t('deliveryOption')}
                </h2>
              </div>

              {/* Radio Selector for Transport vs Pickup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    fulfillmentType === 'DELIVERY'
                      ? 'border-neutral-900 bg-neutral-50/70 shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    value="DELIVERY"
                    className="sr-only"
                    {...form.register('fulfillmentType')}
                  />
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      fulfillmentType === 'DELIVERY'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    <Truck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      {locale === 'ta' ? 'வீட்டு முகவரி பார்சல்' : 'Doorstep Transport'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locale === 'ta' ? 'லாரி சர்வீஸ் மூலம் பாதுகாப்பான டெலிவரி' : 'Safe dispatch via registered logistics'}
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    fulfillmentType === 'PICKUP'
                      ? 'border-neutral-900 bg-neutral-50/70 shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    value="PICKUP"
                    className="sr-only"
                    {...form.register('fulfillmentType')}
                  />
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      fulfillmentType === 'PICKUP'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    <Store className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      {locale === 'ta' ? 'சிவகாசி நேரடி கவுண்டர்' : 'Store Pickup'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locale === 'ta' ? 'சிவகாசி ஆபிஸில் நேரில் பெற' : 'Collect at Sivakasi counter'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Delivery Address Fields with Dependent State & City Selection */}
              {fulfillmentType === 'DELIVERY' && (
                <div className="space-y-4 pt-2 animate-fade-in">
                  {/* State & Dependent City Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        {locale === 'ta' ? 'மாநிலம் (State)' : 'State'} *
                      </label>
                      <select
                        value={form.watch('stateId') || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          form.setValue('stateId', val, { shouldValidate: true });
                          form.setValue('cityId', '', { shouldValidate: true });
                          form.setValue('city', '');
                        }}
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer shadow-xs"
                      >
                        <option value="">{isStatesLoading ? 'Loading states...' : 'Select State'}</option>
                        {states.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        {locale === 'ta' ? 'மாவட்டம் / நகரம் (City)' : 'City / District'} *
                      </label>
                      <select
                        value={form.watch('cityId') || ''}
                        disabled={!selectedStateId || isCitiesLoading}
                        onChange={(e) => {
                          const val = e.target.value;
                          form.setValue('cityId', val, { shouldValidate: true });
                          const found = cities.find((c) => c.id === Number(val));
                          if (found) form.setValue('city', found.name);
                        }}
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!selectedStateId
                            ? 'Select State First'
                            : isCitiesLoading
                            ? 'Loading cities...'
                            : 'Select City'}
                        </option>
                        {cities.map((ct) => (
                          <option key={ct.id} value={ct.id}>
                            {ct.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Street Address & Pincode */}
                  <Input
                    label={`${t('addressLine1')} *`}
                    placeholder={t('addressLine1Placeholder')}
                    error={form.formState.errors.address?.message}
                    {...form.register('address')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={`${t('pincode')} *`}
                      placeholder={t('pincodePlaceholder')}
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
                <span className="h-7 w-7 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shadow-xs font-mono">
                  03
                </span>
                <h2 className="font-bold text-base text-foreground tracking-tight font-heading">
                  {t('orderNotes')}
                </h2>
              </div>
              <Textarea
                placeholder={t('orderNotesPlaceholder')}
                {...form.register('notes')}
              />
            </div>
          </div>

          {/* Right: Order Summary Breakdown */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white sticky top-24 space-y-6 shadow-sm">
              <h2 className="font-bold text-base text-foreground tracking-tight pb-3 border-b border-neutral-100 font-heading">
                {t('orderSummary')} ({itemCount} {itemCount === 1 ? tCart('item') : tCart('items')})
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => {
                  const displayName = getLocalizedName(item, locale);
                  return (
                    <div key={item.productId} className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-foreground font-medium truncate max-w-[65%]">
                        {displayName} <span className="text-muted-foreground font-normal">× {item.quantity}</span>
                      </span>
                      <span className="font-bold text-foreground font-mono">
                        {formatCurrency(item.sellingPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculation */}
              <div className="border-t border-neutral-100 pt-4 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCart('estimatedTotal')}</span>
                  <span className="font-semibold font-mono">{formatCurrency(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>{tCart('totalSavings')}</span>
                    <span className="font-mono">-{formatCurrency(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{locale === 'ta' ? 'போக்குவரத்து முறை' : 'Fulfillment'}</span>
                  <span>
                    {fulfillmentType === 'DELIVERY'
                      ? (locale === 'ta' ? 'வீட்டு முகவரி பார்சல்' : 'Doorstep transport')
                      : (locale === 'ta' ? 'சிவகாசி கவுண்டர் (இலவசம்)' : 'Store pickup (Free)')}
                  </span>
                </div>
              </div>

              {/* Total Box */}
              <div className="border-t border-neutral-100 pt-4 flex items-baseline justify-between">
                <span className="font-bold text-base text-foreground">{tCart('estimatedTotal')}</span>
                <span className="text-xl font-bold text-foreground font-mono">
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
                {t('submitEnquiry')}
                <ArrowRight className="h-4 w-4" />
              </StoreButton>

              {/* WhatsApp Notice Box */}
              <div className="p-4 rounded-[20px] sm:rounded-[22px] bg-neutral-50 text-xs text-muted-foreground flex items-start gap-3">
                <MessageSquare className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                <p className="leading-relaxed">
                  <strong>{locale === 'ta' ? 'ஆன்லைன் கட்டணம் தேவையில்லை.' : 'No online payment required.'}</strong>{' '}
                  {locale === 'ta'
                    ? 'விசாரணை சமர்ப்பித்ததும், அதிகாரப்பூர்வ ரசீது மற்றும் இருப்பு உறுதிப்படுத்தல் உங்கள் வாட்ஸ்அப்பிற்கு அனுப்பப்படும்.'
                    : 'Once placed, you will receive an official invoice on WhatsApp to verify and confirm.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span>{locale === 'ta' ? '100% பாதுகாப்பான சிவகாசி நேரடி விநியோகம்' : '100% Secure Sivakasi Factory Direct'}</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* High Court Legal Compliance Notice Confirmation Modal */}
      <EnquiryNoticeModal
        isOpen={showNoticeModal}
        onClose={() => {
          if (!submitting) setShowNoticeModal(false);
        }}
        onConfirm={() => {
          if (pendingFormData) {
            executeBooking(pendingFormData);
          }
        }}
        isLoading={submitting}
      />
    </div>
  );
}
