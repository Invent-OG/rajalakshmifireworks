'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Truck, MessageSquare, Sparkles, UserCog, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Banner } from '@/components/ui/banner';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
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
  const [initialized, setInitialized] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json?.settings && !initialized) {
        const s = json.settings;
        setMinOrderValue(s.MIN_ORDER_VALUE ?? '500');
        setDeliveryCharge(s.DELIVERY_CHARGE ?? '50');
        setFreeDeliveryAbove(s.FREE_DELIVERY_ABOVE ?? '2000');
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
    <div className="max-w-3xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure order thresholds, dispatch charges, and contact desk details.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="font-medium text-xs self-start sm:self-auto"
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          <Save className="h-4 w-4" /> Save Settings
        </Button>
      </div>

      <div className="space-y-6">
        {/* Admin Account & Security Shortcut */}
        <div className="p-5 rounded-2xl bg-brand/5 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Admin Profile & Password Security
              </h3>
              <p className="text-xs text-muted-foreground">
                Update your login email address, staff display name, and manage account password.
              </p>
            </div>
          </div>
          <Link
            href="/admin/profile"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-white hover:bg-brand/90 text-xs font-semibold shrink-0 transition-colors shadow-xs self-start sm:self-auto"
          >
            <span>Manage Password & Email</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Cart & Ordering Rules */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Truck className="h-4 w-4 text-foreground" />
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              01. Order & Fulfillment Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Store Contact & WhatsApp Details */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <MessageSquare className="h-4 w-4 text-foreground" />
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              02. Store Contact & WhatsApp Desk
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                03. Top Storefront Announcement Banner
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground select-none">
              <input
                type="checkbox"
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
                className="rounded border-border text-brand focus:ring-brand h-4 w-4"
              />
              <span>Banner Active</span>
            </label>
          </div>

          <div className="space-y-4">
            <Input
              label="Banner Announcement Text *"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="e.g. Direct from Sivakasi • 100% Genuine Factory Sealed Fireworks • Wholesale Pricing"
              hint="Appears prominently at the very top of the store across all customer pages"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Target Link (Optional)"
                value={bannerLink}
                onChange={(e) => setBannerLink(e.target.value)}
                placeholder="/products"
                hint="Relative path or URL for the explore link"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Animation Style / Variant
                </label>
                <select
                  value={bannerVariant}
                  onChange={(e) => setBannerVariant(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="rainbow">Animated Festive Rainbow (Moving Celebration Gradient)</option>
                  <option value="normal">Standard Solid Background</option>
                </select>
                <span className="text-[11px] text-muted-foreground block">
                  Rainbow uses dynamic festive colors with smooth CSS gradient flow
                </span>
              </div>
            </div>

            {/* Live Preview */}
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
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
                    height="2.5rem"
                    changeLayout={false}
                    className="bg-neutral-950 text-white border-b border-white/10 text-xs sm:text-sm font-medium tracking-tight"
                  >
                    <div className="flex items-center justify-center gap-2 truncate px-4">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0 animate-pulse" />
                      <span className="truncate">{bannerText || 'Your announcement message...'}</span>
                      {bannerLink && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 underline underline-offset-2 ml-1 shrink-0">
                          Explore →
                        </span>
                      )}
                    </div>
                  </Banner>
                ) : (
                  <div className="py-3 px-4 bg-muted/40 text-center text-xs text-muted-foreground">
                    Banner is currently disabled. Toggle &quot;Banner Active&quot; to display it on the store.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
