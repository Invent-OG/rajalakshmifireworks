'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCart } from '@/hooks/use-cart';
import { StoreButton } from '@/components/ui/store-button';
import { Input, Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { EnquiryNoticeModal } from '@/components/store/enquiry-notice-modal';
import { formatCurrency } from '@/lib/utils/format';
import { Truck, Store, ShoppingBag, ShieldCheck, MessageSquare, ArrowRight, MapPin, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    area: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional(),
    notes: z.string().optional(),
    referralCode: z.string().max(40).optional(),
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

import { Providers } from '@/components/providers';

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

function CheckoutPageContent() {
  const { items, subtotal, totalSavings, itemCount, clearCart } = useCart();
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
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
      area: '',
      address: '',
      city: '',
      pincode: '',
      notes: '',
      referralCode: '',
    },
  });

  const [attributionSource, setAttributionSource] = useState<'CODE' | 'LINK'>('CODE');
  const [refValidation, setRefValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    agentName?: string;
    message?: string;
  }>({ status: 'idle' });

  const validateCode = async (code: string) => {
    if (!code || !code.trim()) {
      setRefValidation({ status: 'idle' });
      return;
    }
    setRefValidation({ status: 'checking' });
    try {
      const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(code.trim().toUpperCase())}`);
      const data = await res.json();
      if (res.ok && data.valid && data.agent) {
        setRefValidation({
          status: 'valid',
          agentName: data.agent.name,
          message: `Attributed to agent: ${data.agent.name} (${data.agent.agentCode})`,
        });
      } else {
        setRefValidation({
          status: 'invalid',
          message: data.message || 'Invalid or inactive referral code',
        });
      }
    } catch {
      setRefValidation({
        status: 'invalid',
        message: 'Could not verify referral code',
      });
    }
  };

  useEffect(() => {
    try {
      let code = '';
      const match = document.cookie.match(/(^| )rf_agent_ref=([^;]+)/);
      if (match) {
        code = decodeURIComponent(match[2]);
      } else {
        code = localStorage.getItem('rf_agent_ref') || '';
      }
      if (code && !form.getValues('referralCode')) {
        form.setValue('referralCode', code.toUpperCase());
        setAttributionSource('LINK');
        validateCode(code.toUpperCase());
      }
    } catch (e) {}
  }, []);

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

  // Fetch Serviceable Delivery Areas configured by Admin
  const { data: deliveryAreasData, isLoading: isAreasLoading } = useQuery<{
    areas: string[];
    uniqueAreas: string[];
  }>({
    queryKey: ['delivery-areas'],
    queryFn: async () => {
      const res = await fetch('/api/delivery-areas');
      if (!res.ok) return { areas: [], uniqueAreas: [] };
      return res.json();
    },
  });

  const deliveryAreas: string[] = deliveryAreasData?.areas || deliveryAreasData?.uniqueAreas || [];

  // Fetch Store Settings (delivery charge, min order value, free delivery threshold)
  const { data: settingsData } = useQuery<{ settings: Record<string, string> }>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return { settings: {} };
      return res.json();
    },
  });

  const deliveryChargeRate = Number(settingsData?.settings?.DELIVERY_CHARGE || 50);
  const freeDeliveryAbove = Number(settingsData?.settings?.FREE_DELIVERY_ABOVE || 0);
  const minOrderValue = Number(settingsData?.settings?.MIN_ORDER_VALUE || 500);

  const deliveryCharge =
    fulfillmentType === 'DELIVERY'
      ? (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove ? 0 : deliveryChargeRate)
      : 0;

  const grandTotal = subtotal + deliveryCharge;

  // When state changes, reset cityId and city name in form
  useEffect(() => {
    if (selectedStateId) {
      form.setValue('cityId', '');
      form.setValue('city', '');
    }
  }, [selectedStateId, form]);

  const placeOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to place order');
      }
      return result;
    },
    onSuccess: (result) => {
      // Resolve invoiceNumber or orderId from API response
      const invoiceNumber =
        result?.order?.invoiceNumber ||
        result?.invoiceNumber ||
        result?.order?.orderId ||
        result?.orderId;

      if (!invoiceNumber) {
        throw new Error('Order placed successfully, but confirmation reference was missing.');
      }

      setIsOrderPlaced(true);

      // Clear local cart
      clearCart();

      // Show success
      toast.success(
        locale === 'ta'
          ? 'உங்கள் தீபாவளி பட்டாசு விசாரணை வெற்றிகரமாக பதிவானது!'
          : 'Your Diwali fireworks enquiry has been placed successfully!'
      );

      // Redirect directly to localized Confirmation Page
      const targetUrl = `/${locale}/order-confirmation/${encodeURIComponent(String(invoiceNumber))}`;
      window.location.href = targetUrl;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place order. Please try again.');
    },
    onSettled: () => {
      setShowNoticeModal(false);
    },
  });

  const submitting = placeOrderMutation.isPending;

  const getHref = (path: string) => (locale === 'en' ? path : `/${locale}${path}`);

  if (items.length === 0 && !submitting && !isOrderPlaced) {
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

  function executeBooking(data: CheckoutFormData) {
    if (minOrderValue > 0 && subtotal < minOrderValue) {
      toast.error(
        locale === 'ta'
          ? `குறைந்தபட்ச ஆர்டர் மதிப்பு ${formatCurrency(minOrderValue)} ஆகும்.`
          : `Minimum order value is ${formatCurrency(minOrderValue)}. Please add more crackers to proceed.`
      );
      return;
    }

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
              stateId: data.stateId ? Number(data.stateId) : undefined,
              cityId: data.cityId ? Number(data.cityId) : undefined,
              state: selectedState?.name || '',
              city: selectedCity?.name || data.city || '',
              area: data.area?.trim() || undefined,
              pincode: data.pincode!.trim(),
            }
          : undefined,
      notes: data.notes?.trim() || undefined,
      referralCode: data.referralCode?.trim() ? data.referralCode.trim().toUpperCase() : undefined,
      attributionSource: data.referralCode?.trim() ? attributionSource : undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      idempotencyKey,
    };

    placeOrderMutation.mutate(payload);
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
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#141414] dark:border dark:border-[#282828] shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center gap-3 pb-1 border-b border-neutral-100 dark:border-[#282828]">
                <span className="h-7 w-7 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shadow-xs font-mono">
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
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#141414] dark:border dark:border-[#282828] shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center gap-3 pb-1 border-b border-neutral-100 dark:border-[#282828]">
                <span className="h-7 w-7 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shadow-xs font-mono">
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
                      ? 'border-neutral-900 bg-neutral-50/70 dark:border-white dark:bg-[#1f1f1f] shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-[#282828] dark:bg-[#141414] dark:hover:border-[#383838]'
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
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                        : 'bg-neutral-200 text-neutral-600 dark:bg-[#282828] dark:text-neutral-400'
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
                      ? 'border-neutral-900 bg-neutral-50/70 dark:border-white dark:bg-[#1f1f1f] shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-[#282828] dark:bg-[#141414] dark:hover:border-[#383838]'
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
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                        : 'bg-neutral-200 text-neutral-600 dark:bg-[#282828] dark:text-neutral-400'
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
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-[#282828] bg-white dark:bg-[#181818] text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white cursor-pointer shadow-xs"
                      >
                        <option value="" className="bg-white dark:bg-[#181818] text-foreground">{isStatesLoading ? 'Loading states...' : 'Select State'}</option>
                        {states.map((st) => (
                          <option key={st.id} value={st.id} className="bg-white dark:bg-[#181818] text-foreground">
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
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-[#282828] bg-white dark:bg-[#181818] text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" className="bg-white dark:bg-[#181818] text-foreground">
                          {!selectedStateId
                            ? 'Select State First'
                            : isCitiesLoading
                            ? 'Loading cities...'
                            : 'Select City'}
                        </option>
                        {cities.map((ct) => (
                          <option key={ct.id} value={ct.id} className="bg-white dark:bg-[#181818] text-foreground">
                            {ct.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Delivery Area Dropdown */}
                  {deliveryAreas.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-[#181818] border border-neutral-200/90 dark:border-[#282828] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-neutral-900 dark:text-neutral-100" />
                          <span>
                            {locale === 'ta' ? 'டெலிவரி பகுதி (Delivery Area)' : 'Select Delivery Area / Locality'} *
                          </span>
                        </label>
                        {form.watch('area') && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ Delivery Available
                          </span>
                        )}
                      </div>

                      <select
                        value={form.watch('area') || ''}
                        onChange={(e) => {
                          form.setValue('area', e.target.value);
                        }}
                        className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-[#282828] bg-white dark:bg-[#121212] text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white cursor-pointer shadow-xs"
                      >
                        <option value="" className="bg-white dark:bg-[#121212] text-foreground">
                          {isAreasLoading
                            ? 'Loading delivery areas...'
                            : locale === 'ta'
                            ? '-- உங்கள் டெலிவரி பகுதியைத் தேர்ந்தெடுக்கவும் --'
                            : '-- Select Available Delivery Area --'}
                        </option>
                        {deliveryAreas.map((areaName, idx) => (
                          <option key={idx} value={areaName} className="bg-white dark:bg-[#121212] text-foreground">
                            {areaName}
                          </option>
                        ))}
                      </select>

                      <p className="text-[11px] text-muted-foreground leading-normal">
                        {locale === 'ta'
                          ? 'எங்கள் பிரத்யேக லாரி சர்வீஸ் & டெலிவரி பார்ட்னர்கள் இப்பகுதிகளுக்கு நேரடியாக டெலிவரி செய்கின்றனர்.'
                          : 'Our verified transport partners directly cover these delivery zones for safe doorstep dispatch.'}
                      </p>
                    </div>
                  )}

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
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#141414] dark:border dark:border-[#282828] shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shadow-xs font-mono">
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

            {/* Step 04: Sales Agent Referral Code */}
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#141414] dark:border dark:border-[#282828] shadow-sm dark:shadow-none space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-[#282828]">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shadow-xs font-mono">
                    04
                  </span>
                  <h2 className="font-bold text-base text-foreground tracking-tight font-heading flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    {locale === 'ta' ? 'விற்பனை முகவர் பரிந்துரை குறியீடு (விருப்பத்தேர்வு)' : 'Sales Agent Referral Code (Optional)'}
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {locale === 'ta' ? 'விருப்பத்தேர்வு' : 'Optional'}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {locale === 'ta'
                  ? 'உங்களுக்கு பரிந்துரைத்த விற்பனை முகவரின் குறியீட்டை உள்ளிடவும். இது முகவர் கண்காணிப்பிற்கு மட்டுமே பயன்படுத்தப்படும் (விலையில் மாற்றம் இருக்காது).'
                  : 'Enter your sales agent referral code if you were introduced by one. Used strictly for sales tracking; prices remain unchanged.'}
              </p>

              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="e.g. GUNA01, RAJ01"
                    maxLength={30}
                    autoCapitalize="characters"
                    value={form.watch('referralCode') || ''}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      form.setValue('referralCode', val);
                      setAttributionSource('CODE');
                      if (!val.trim()) {
                        setRefValidation({ status: 'idle' });
                      }
                    }}
                    className="font-mono uppercase tracking-wider"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  disabled={!form.watch('referralCode')?.trim() || refValidation.status === 'checking'}
                  onClick={() => validateCode(form.watch('referralCode') || '')}
                  className="shrink-0 text-xs h-10 px-4"
                >
                  {refValidation.status === 'checking'
                    ? (locale === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying...')
                    : (locale === 'ta' ? 'சரிபார்' : 'Verify')}
                </Button>
              </div>

              {refValidation.status === 'valid' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <span className="font-semibold">{refValidation.message}</span>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Order will be attributed to this sales agent. Pricing remains standard.
                    </div>
                  </div>
                </div>
              )}

              {refValidation.status === 'invalid' && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{refValidation.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary Breakdown */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#141414] dark:border dark:border-[#282828] sticky top-24 space-y-6 shadow-sm dark:shadow-none">
              <h2 className="font-bold text-base text-foreground tracking-tight pb-3 border-b border-neutral-100 dark:border-[#282828] font-heading">
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
              <div className="border-t border-neutral-100 dark:border-[#282828] pt-4 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tCart('estimatedTotal')}</span>
                  <span className="font-semibold font-mono">{formatCurrency(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
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
                {fulfillmentType === 'DELIVERY' && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>{locale === 'ta' ? 'டெலிவரி கட்டணம்' : 'Delivery Charge'}</span>
                    <span className="font-semibold font-mono text-foreground">
                      {deliveryCharge > 0 ? (
                        formatCurrency(deliveryCharge)
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {locale === 'ta' ? 'இலவசம் (Free)' : 'FREE'}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Box */}
              <div className="border-t border-neutral-100 dark:border-[#282828] pt-4 flex items-baseline justify-between">
                <span className="font-bold text-base text-foreground">
                  {locale === 'ta' ? 'மொத்த தொகை' : 'Final Payable Amount'}
                </span>
                <span className="text-xl font-bold text-foreground font-mono">
                  {formatCurrency(grandTotal)}
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
              <div className="p-4 rounded-[20px] sm:rounded-[22px] bg-neutral-50 dark:bg-[#181818] dark:border dark:border-[#282828] text-xs text-muted-foreground flex items-start gap-3">
                <MessageSquare className="h-4 w-4 shrink-0 text-foreground mt-0.5" />
                <p className="leading-relaxed">
                  <strong>{locale === 'ta' ? 'ஆன்லைன் கட்டணம் தேவையில்லை.' : 'No online payment required.'}</strong>{' '}
                  {locale === 'ta'
                    ? 'விசாரணை சமர்ப்பித்ததும், அதிகாரப்பூர்வ ரசீது மற்றும் இருப்பு உறுதிப்படுத்தல் உங்கள் வாட்ஸ்அப்பிற்கு அனுப்பப்படும்.'
                    : 'Once placed, you will receive an official invoice on WhatsApp to verify and confirm.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
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

export default function CheckoutPage() {
  return (
    <Providers>
      <CheckoutPageContent />
    </Providers>
  );
}
