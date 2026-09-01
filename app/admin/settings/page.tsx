'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Truck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [minOrderValue, setMinOrderValue] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState('');
  const [maxQuantityPerItem, setMaxQuantityPerItem] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
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
      toast.success('Store configurations updated successfully');
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
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Store & Logistics Configuration
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure order thresholds, Sivakasi dispatch parameters, and WhatsApp helpline.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="font-bold text-xs shadow-md shadow-orange-500/25 self-start sm:self-auto"
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          <Save className="h-4 w-4" /> Save Configuration
        </Button>
      </div>

      <div className="space-y-6">
        {/* Cart & Ordering Rules */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">
              01. Cart & Delivery Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              label="Free Delivery Threshold (₹)"
              type="number"
              value={freeDeliveryAbove}
              onChange={(e) => setFreeDeliveryAbove(e.target.value)}
              hint="Orders above this amount qualify for zero delivery fee"
            />

            <Input
              label="Max Quantity per Item in Bag"
              type="number"
              value={maxQuantityPerItem}
              onChange={(e) => setMaxQuantityPerItem(e.target.value)}
              hint="Prevents stock hoarding on single cracker item"
            />
          </div>
        </div>

        {/* Store Contact & WhatsApp Details */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            <MessageCircle className="h-5 w-5 text-emerald-500" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">
              02. Store Contact & WhatsApp Desk
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Direct Helpline Phone"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              placeholder="+91 98765 43210"
            />

            <Input
              label="Official WhatsApp Order Number"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              hint="Country code with mobile number (e.g. 919876543210)"
            />
          </div>

          <Textarea
            label="Factory Counter & Warehouse Address"
            rows={3}
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            placeholder="Enter full physical address in Sivakasi..."
          />
        </div>
      </div>
    </div>
  );
}
