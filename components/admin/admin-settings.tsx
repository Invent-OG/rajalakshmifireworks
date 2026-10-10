'use client';

import Link from '@/components/ui/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Truck, MessageSquare, Sparkles, UserCog, ArrowRight, Sun, Moon, Printer, CreditCard, FileText, Sliders, X } from 'lucide-react';
import { toast } from 'sonner';
import { Banner } from '@/components/ui/banner';
import { useAdminTheme } from '@/hooks/use-admin-theme';

import { withAdminShell } from './admin-shell';

function AdminSettingsPageContent() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useAdminTheme();
  const [minOrderValue, setMinOrderValue] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState('');
  const [maxQuantityPerItem, setMaxQuantityPerItem] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerText, setBannerText] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerVariant, setBannerVariant] = useState('rainbow');
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceGstin, setInvoiceGstin] = useState('');
  const [invoiceLicenseNo, setInvoiceLicenseNo] = useState('');
  const [invoiceBankName, setInvoiceBankName] = useState('');
  const [invoiceAccountName, setInvoiceAccountName] = useState('');
  const [invoiceAccountNumber, setInvoiceAccountNumber] = useState('');
  const [invoiceIfsc, setInvoiceIfsc] = useState('');
  const [invoiceUpiId, setInvoiceUpiId] = useState('');
  const [invoiceTerms, setInvoiceTerms] = useState('');
  const [invoiceSafetyNotice, setInvoiceSafetyNotice] = useState('');
  const [initialized, setInitialized] = useState(false);

  const demoOrder = {
    id: 1,
    invoiceNumber: 'FW-20261007-0002',
    orderStatus: 'CONFIRMED',
    fulfillmentType: 'DELIVERY',
    subtotal: '3250.00',
    discountAmount: '0.00',
    deliveryCharge: '0.00',
    totalAmount: '3250.00',
    finalAmount: '3250.00',
    customerNameSnapshot: 'Diya',
    customerMobileSnapshot: '8825631744',
    placedAt: new Date().toISOString(),
    addressSnapshot: {
      address: '104, Vaigai street, janatha nagar west',
      city: 'Coimbatore',
      pincode: '641035',
    },
    paymentStatus: 'PAID',
    items: [
      {
        id: 1,
        productNameSnapshot: 'SILVER SPARKLERS',
        quantity: 1,
        sellingPriceSnapshot: '3250.00',
        mrpSnapshot: '5500.00',
        lineTotal: '3250.00',
      },
    ],
  };

  const { isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json?.settings && !initialized) {
        const s = json.settings;
        setMinOrderValue(s.MIN_ORDER_VALUE ?? '500');
        setDeliveryCharge(s.DELIVERY_CHARGE ?? '50');
        setFreeDeliveryAbove(s.FREE_DELIVERY_ABOVE ?? '0');
        setMaxQuantityPerItem(s.MAX_QUANTITY_PER_ITEM ?? '50');
        setStorePhone(s.STORE_PHONE ?? '+91 98765 43210');
        setWhatsappNumber(s.WHATSAPP_NUMBER ?? '919876543210');
        setStoreAddress(s.STORE_ADDRESS ?? '123 Main Road, Sivakasi, Tamil Nadu 626123');
        setBannerEnabled(s.ANNOUNCEMENT_BANNER_ENABLED !== 'false');
        setBannerText(
          s.ANNOUNCEMENT_BANNER_TEXT ??
            'Direct from Sivakasi • 100% Genuine Factory Sealed Fireworks • Wholesale Pricing'
        );
        setBannerLink(s.ANNOUNCEMENT_BANNER_LINK ?? '/products');
        setBannerVariant(s.ANNOUNCEMENT_BANNER_VARIANT ?? 'rainbow');
        setInvoiceTitle(s.INVOICE_DEFAULT_TITLE ?? 'ESTIMATE / DISPATCH MEMO');
        setInvoiceGstin(s.INVOICE_GSTIN ?? '33AAAAA0000A1Z5');
        setInvoiceLicenseNo(s.INVOICE_LICENSE_NO ?? 'E/SC/TN/2024/00142 (PESO Approved)');
        setInvoiceBankName(s.INVOICE_BANK_NAME ?? 'State Bank of India');
        setInvoiceAccountName(s.INVOICE_ACCOUNT_NAME ?? 'Rajalakshmi Fireworks Sivakasi');
        setInvoiceAccountNumber(s.INVOICE_ACCOUNT_NUMBER ?? '38492019482');
        setInvoiceIfsc(s.INVOICE_IFSC ?? 'SBIN0001234');
        setInvoiceUpiId(s.INVOICE_UPI_ID ?? 'rajalakshmifireworks@sbi');
        setInvoiceTerms(
          s.INVOICE_TERMS ??
            '1. Goods once sold cannot be returned or exchanged.\n2. All fireworks are manufactured & dispatched under Supreme Court & PESO safety standards.\n3. Transport risk is on buyer\'s account.\n4. Subject to Sivakasi Jurisdiction only.'
        );
        setInvoiceSafetyNotice(
          s.INVOICE_SAFETY_NOTICE ??
            'This is a computer generated invoice/dispatch memo. All products conform to Sivakasi fireworks safety guidelines. Keep strictly away from unattended children.'
        );
        setInitialized(true);
      }
      return json;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        MIN_ORDER_VALUE: minOrderValue,
        DELIVERY_CHARGE: deliveryCharge,
        FREE_DELIVERY_ABOVE: freeDeliveryAbove,
        MAX_QUANTITY_PER_ITEM: maxQuantityPerItem,
        STORE_PHONE: storePhone,
        WHATSAPP_NUMBER: whatsappNumber,
        STORE_ADDRESS: storeAddress,
        ANNOUNCEMENT_BANNER_ENABLED: bannerEnabled ? 'true' : 'false',
        ANNOUNCEMENT_BANNER_TEXT: bannerText,
        ANNOUNCEMENT_BANNER_LINK: bannerLink,
        ANNOUNCEMENT_BANNER_VARIANT: bannerVariant,
        INVOICE_DEFAULT_TITLE: invoiceTitle,
        INVOICE_GSTIN: invoiceGstin,
        INVOICE_LICENSE_NO: invoiceLicenseNo,
        INVOICE_BANK_NAME: invoiceBankName,
        INVOICE_ACCOUNT_NAME: invoiceAccountName,
        INVOICE_ACCOUNT_NUMBER: invoiceAccountNumber,
        INVOICE_IFSC: invoiceIfsc,
        INVOICE_UPI_ID: invoiceUpiId,
        INVOICE_TERMS: invoiceTerms,
        INVOICE_SAFETY_NOTICE: invoiceSafetyNotice,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to save settings');
      return resData;
    },
    onSuccess: () => {
      toast.success('Store settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (isLoading && !initialized) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Configure order thresholds, dispatch charges, and contact desk details.
          </p>
        </div>

        <Button
          variant="primary"
          size="default"
          className="h-10 px-5 font-semibold text-xs sm:text-sm self-start sm:self-auto cursor-pointer shadow-xs rounded-full"
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-1.5" /> Save Settings
        </Button>
      </div>

      <div className="space-y-6">
        {/* Admin Interface Theme Appearance Card */}
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 border border-border">
              {theme === 'dark' ? (
                <Moon className="h-6 w-6 text-indigo-400" />
              ) : (
                <Sun className="h-6 w-6 text-amber-500" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Admin Panel Theme Appearance
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Switch between high-contrast dark operations mode and clean light mode.
              </p>
            </div>
          </div>
          <div className="flex items-center p-1 rounded-full bg-muted/70 border border-border shrink-0 self-start sm:self-auto shadow-2xs">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 h-9 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className={`h-4 w-4 ${theme === 'light' ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span>Light Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 h-9 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className={`h-4 w-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-muted-foreground'}`} />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Hero Carousel Visual Director Shortcut */}
        <div className="p-6 rounded-2xl bg-brand/5 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Hero Carousel & Visual Slides
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure slides, custom colors, titles, images, USP trust signals & category preview tiles.
              </p>
            </div>
          </div>

          <Link href="/admin/hero-slides">
            <Button variant="outline" size="md" className="h-11 px-5 font-bold text-sm whitespace-nowrap cursor-pointer">
              Open Hero Slides <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Admin Account & Security Shortcut */}
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 border border-border">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Admin Profile & Password Security
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Update your login email address, staff display name, and manage account password.
              </p>
            </div>
          </div>
          <Link
            href="/admin/profile"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 text-sm font-bold shrink-0 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <span>Manage Password & Email</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Cart & Ordering Rules */}
        <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <Truck className="h-5 w-5 text-foreground" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-foreground">
              01. Order & Fulfillment Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Input
              label="Minimum Order Value (₹) *"
              type="number"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              hint="Shoppers cannot checkout below this cart value"
            />

            <Input
              label="Standard Delivery Charge (₹) *"
              type="number"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              hint="Flat courier / transport fee for doorstep dispatch"
            />

            <Input
              label="Free Delivery Above (₹)"
              type="number"
              value={freeDeliveryAbove}
              onChange={(e) => setFreeDeliveryAbove(e.target.value)}
              placeholder="0 (Disabled)"
              hint="Set 0 to charge delivery fee on all orders"
            />
          </div>
        </div>

        {/* Store Contact & WhatsApp Details */}
        <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <MessageSquare className="h-5 w-5 text-foreground" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-foreground">
              02. Store Contact & WhatsApp Desk
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Store Helpline Phone"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              placeholder="+91 98765 43210"
            />

            <Input
              label="WhatsApp Order Mobile"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              hint="Country code with mobile number (e.g. 919876543210)"
            />
          </div>

          <Textarea
            label="Factory Warehouse Address"
            rows={3}
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            placeholder="Enter physical address in Sivakasi..."
          />
        </div>

        {/* Store Announcement & Rainbow Banner */}
        <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-brand" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-foreground">
                03. Top Storefront Announcement Banner
              </h2>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground select-none">
              <input
                type="checkbox"
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
                className="rounded border-border text-brand focus:ring-brand h-4.5 w-4.5"
              />
              <span>Banner Active</span>
            </label>
          </div>

          <div className="space-y-5">
            <Input
              label="Banner Announcement Text *"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="e.g. Direct from Sivakasi • 100% Genuine Factory Sealed Fireworks • Wholesale Pricing"
              hint="Appears prominently at the very top of the store across all customer pages"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Target Link (Optional)"
                value={bannerLink}
                onChange={(e) => setBannerLink(e.target.value)}
                placeholder="/products"
                hint="Relative path or URL for the explore link"
              />

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Animation Style / Variant
                </label>
                <select
                  value={bannerVariant}
                  onChange={(e) => setBannerVariant(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="rainbow">Animated Festive Rainbow (Moving Celebration Gradient)</option>
                  <option value="normal">Standard Solid Background</option>
                </select>
                <span className="text-xs sm:text-sm text-muted-foreground block">
                  Rainbow uses dynamic festive colors with smooth CSS gradient flow
                </span>
              </div>
            </div>

            {/* Live Preview */}
            <div className="pt-2">
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2.5">
                Live Storefront Preview:
              </p>
              <div className="rounded-xl overflow-hidden border border-border/80 shadow-xs">
                {bannerEnabled ? (
                  <Banner
                    variant={bannerVariant as 'rainbow' | 'normal'}
                    rainbowColors={[
                      'rgba(255, 75, 43, 0.85)',
                      'rgba(255, 185, 0, 0.85)',
                      'rgba(236, 72, 153, 0.8)',
                      'rgba(56, 189, 248, 0.8)',
                      'rgba(52, 211, 153, 0.8)',
                    ]}
                    height="2.75rem"
                    changeLayout={false}
                    className="bg-neutral-950 text-white border-b border-white/10 text-sm font-medium tracking-tight"
                  >
                    <div className="flex items-center justify-center gap-2 truncate px-4">
                      <Sparkles className="h-4 w-4 text-amber-300 shrink-0 animate-pulse" />
                      <span className="truncate">{bannerText || 'Your announcement message...'}</span>
                      {bannerLink && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 underline underline-offset-2 ml-1 shrink-0">
                          Explore →
                        </span>
                      )}
                    </div>
                  </Banner>
                ) : (
                  <div className="py-4 px-4 bg-muted/40 text-center text-sm text-muted-foreground">
                    Banner is currently disabled. Toggle &quot;Banner Active&quot; to display it on the store.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 04. Invoice & Print Memo Customization Defaults */}
        <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <Printer className="h-5 w-5 text-foreground" />
              <div>
                <h2 className="font-bold text-sm uppercase tracking-wider text-foreground">
                  04. Invoice & Print Slip Customization Defaults
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure default business registration, bank account, and terms printed on customer invoices.
                </p>
              </div>
            </div>
            <a
              href="/admin/invoice-editor"
              className="text-xs h-9 px-4 font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-black cursor-pointer shadow-xs inline-flex items-center gap-1.5 rounded-full transition-all"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Open Dedicated Invoice Editor</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input
              label="Default Invoice Title"
              value={invoiceTitle}
              onChange={(e) => setInvoiceTitle(e.target.value)}
              placeholder="e.g. ESTIMATE / DISPATCH MEMO"
              hint="Printed at top right badge of slip"
            />

            <Input
              label="Store GSTIN Number"
              value={invoiceGstin}
              onChange={(e) => setInvoiceGstin(e.target.value)}
              placeholder="e.g. 33AAAAA0000A1Z5"
              hint="Tax identifier for invoices"
            />

            <Input
              label="PESO Explosives License No."
              value={invoiceLicenseNo}
              onChange={(e) => setInvoiceLicenseNo(e.target.value)}
              placeholder="e.g. E/SC/TN/2024/00142"
              hint="Fireworks manufacturing/storage license"
            />
          </div>

          <div className="pt-2 border-t border-border">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> Bank Account & UPI Payment Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Input
                label="Bank Name"
                value={invoiceBankName}
                onChange={(e) => setInvoiceBankName(e.target.value)}
                placeholder="e.g. State Bank of India"
              />

              <Input
                label="Account Holder Name"
                value={invoiceAccountName}
                onChange={(e) => setInvoiceAccountName(e.target.value)}
                placeholder="e.g. Rajalakshmi Fireworks"
              />

              <Input
                label="Bank Account Number"
                value={invoiceAccountNumber}
                onChange={(e) => setInvoiceAccountNumber(e.target.value)}
                placeholder="e.g. 38492019482"
              />

              <Input
                label="IFSC Code"
                value={invoiceIfsc}
                onChange={(e) => setInvoiceIfsc(e.target.value)}
                placeholder="e.g. SBIN0001234"
              />

              <Input
                label="UPI ID / GPay / PhonePe"
                value={invoiceUpiId}
                onChange={(e) => setInvoiceUpiId(e.target.value)}
                placeholder="e.g. rajalakshmifireworks@sbi"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Textarea
              label="Default Terms & Conditions"
              rows={4}
              value={invoiceTerms}
              onChange={(e) => setInvoiceTerms(e.target.value)}
              hint="Printed at the bottom of customer invoices"
            />

            <Textarea
              label="Legal & Safety Notice"
              rows={4}
              value={invoiceSafetyNotice}
              onChange={(e) => setInvoiceSafetyNotice(e.target.value)}
              hint="Sivakasi fireworks compliance statement"
            />
          </div>
        </div>
      </div>


    </div>
  );
}

export default withAdminShell(AdminSettingsPageContent);

