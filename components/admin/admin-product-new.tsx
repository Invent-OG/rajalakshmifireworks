'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productBaseSchema, type ProductBaseInput } from '@/lib/validation/product';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import Link from '@/components/ui/link';
import { toast } from 'sonner';

import { ProductMediaManager, type ProductMediaItem } from '@/components/admin/product-media-manager';
import { ComboProductBuilder, type ComboItemEntry } from '@/components/admin/combo-product-builder';

import { withAdminShell } from './admin-shell';

function NewProductPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([]);
  const [isCombo, setIsCombo] = useState(false);
  const [comboItems, setComboItems] = useState<ComboItemEntry[]>([]);

  const { data: catData } = useQuery({
    queryKey: queryKeys.admin.categories.list(),
    queryFn: () => fetch('/api/admin/categories').then((r) => r.json()),
  });

  const categoriesList = catData?.categories || [];

  const form = useForm<ProductBaseInput>({
    resolver: zodResolver(productBaseSchema),
    defaultValues: {
      name: '',
      categoryId: 0,
      description: '',
      sku: '',
      piecesPerBox: 1,
      boxContent: 1,
      contentUnit: 'Pcs',
      mrp: 0,
      discountPercent: 0,
      sellingPrice: 0,
      stockQuantity: 50,
      lowStockThreshold: 10,
      isActive: true,
      isFeatured: false,
      isBestseller: false,
      isCombo: false,
    },
  });

  const watchMrp = form.watch('mrp');
  const watchSellingPrice = form.watch('sellingPrice');
  const watchDiscount = form.watch('discountPercent');
  const savingsAmount = Math.max(0, (watchMrp || 0) - (watchSellingPrice || 0));

  const handleMrpChange = (newMrp: number) => {
    form.setValue('mrp', newMrp, { shouldValidate: true });
    const currentDiscount = form.getValues('discountPercent') || 0;
    if (currentDiscount > 0 && newMrp > 0) {
      const calcPrice = Math.round(newMrp * (1 - currentDiscount / 100) * 100) / 100;
      form.setValue('sellingPrice', calcPrice, { shouldValidate: true });
    } else {
      const currentPrice = form.getValues('sellingPrice') || 0;
      if (newMrp > 0 && currentPrice > 0) {
        const calcDiscount = Math.max(0, Math.round(((newMrp - currentPrice) / newMrp) * 100));
        form.setValue('discountPercent', calcDiscount);
      }
    }
  };

  const handleDiscountChange = (newDiscount: number) => {
    form.setValue('discountPercent', newDiscount);
    const currentMrp = form.getValues('mrp') || 0;
    if (currentMrp > 0) {
      const calcPrice = Math.round(currentMrp * (1 - newDiscount / 100) * 100) / 100;
      form.setValue('sellingPrice', Math.max(0, calcPrice), { shouldValidate: true });
    }
  };

  const handleSellingPriceChange = (newPrice: number) => {
    form.setValue('sellingPrice', newPrice, { shouldValidate: true });
    const currentMrp = form.getValues('mrp') || 0;
    if (currentMrp > 0) {
      const calcDiscount = Math.max(0, Math.round(((currentMrp - newPrice) / currentMrp) * 100));
      form.setValue('discountPercent', calcDiscount);
    }
  };

  const handleApplyCalculatedPricing = (calcMrp: number, calcPrice: number) => {
    form.setValue('mrp', calcMrp);
    form.setValue('sellingPrice', calcPrice);
    const calcDiscount = calcMrp > 0 ? Math.max(0, Math.round(((calcMrp - calcPrice) / calcMrp) * 100)) : 0;
    form.setValue('discountPercent', calcDiscount);
    toast.success(`Applied calculated prices: MRP ₹${calcMrp}, Price ₹${calcPrice} (${calcDiscount}% OFF)`);
  };

  const createProductMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to create product');
      }
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all });
      toast.success(isCombo ? 'Combo product created successfully' : 'Product created successfully');
      router.push('/admin/products');
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || 'An unexpected error occurred.');
    },
  });

  const submitting = createProductMutation.isPending;

  function onSubmit(data: ProductBaseInput) {
    if (data.sellingPrice > data.mrp) {
      toast.error('Selling price cannot exceed MRP');
      return;
    }

    if (isCombo && comboItems.length === 0) {
      toast.error('Please add at least one product to this combo pack');
      return;
    }

    createProductMutation.mutate({
      ...data,
      isCombo,
      media: mediaItems,
      comboItems: isCombo
        ? comboItems.map((ci, idx) => ({
            productId: ci.productId,
            quantity: ci.quantity,
            sortOrder: idx,
          }))
        : [],
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Link href="/admin/products">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {isCombo ? 'Create Combo / Gift Pack' : 'Add Product'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isCombo
              ? 'Bundle multiple crackers into an attractive festive celebration combo.'
              : 'Add a new firework item to your Sivakasi catalog.'}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Info */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            01. Product Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Title (English) *"
              placeholder={isCombo ? 'e.g. 2026 Mega Family Diwali Combo Box (35 Items)' : 'e.g. 10 cm Electric Sparklers (10 pcs)'}
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />

            <Input
              label="Product Title (Tamil / தமிழ் பெயர்)"
              placeholder={isCombo ? 'எ.கா: 2026 மெகா தீபாவளி குடும்ப காம்போ பாக்ஸ்' : 'எ.கா: 10 செ.மீ எலக்ட்ரிக் கம்பி மத்தாப்பு'}
              error={form.formState.errors.nameTa?.message}
              {...form.register('nameTa')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label={isCombo ? 'Category Collection (Optional)' : 'Category Collection *'}
              placeholder={isCombo ? 'None (Combo Pack)' : 'Select Category'}
              options={[
                ...(isCombo ? [{ value: '', label: 'None (Combo Pack)' }] : []),
                ...categoriesList.map((c: { id: number; name: string; nameTa?: string | null }) => ({
                  value: String(c.id),
                  label: c.nameTa ? `${c.name} (${c.nameTa})` : c.name,
                })),
              ]}
              error={form.formState.errors.categoryId?.message}
              onChange={(e) => form.setValue('categoryId', e.target.value ? parseInt(e.target.value) : null)}
            />

            <Input
              label="SKU / Item Code (Optional)"
              placeholder={isCombo ? 'e.g. CMB-DIWALI-MEGA' : 'e.g. SPK-10CM-ELEC'}
              error={form.formState.errors.sku?.message}
              {...form.register('sku')}
            />

            <Input
              label="Box Content *"
              type="number"
              min={1}
              placeholder="e.g. 10"
              error={form.formState.errors.boxContent?.message || form.formState.errors.piecesPerBox?.message}
              {...form.register('boxContent', {
                valueAsNumber: true,
                onChange: (e) => form.setValue('piecesPerBox', parseInt(e.target.value) || 1),
              })}
            />

            <Input
              label="Unit of Content *"
              placeholder="e.g. Pcs, Pack, Box, Items"
              error={form.formState.errors.contentUnit?.message}
              {...form.register('contentUnit')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="Description & Highlights (English)"
              placeholder={
                isCombo
                  ? 'Describe the assortment, celebration themes, ideal family size, and sparkler varieties included...'
                  : 'Describe the effects, duration, spark patterns, and handling guidelines...'
              }
              error={form.formState.errors.description?.message}
              {...form.register('description')}
            />

            <Textarea
              label="Description & Highlights (Tamil / தமிழ் விளக்கம்)"
              placeholder={
                isCombo
                  ? 'காம்போ பேக்கில் அடங்கியுள்ள பட்டாசுகள், பாதுகாப்பு வழிமுறைகள் பற்றிய தமிழ் விவரம்...'
                  : 'பட்டாசு விளைவுகள், வெளிச்சம் மற்றும் பயன்பாட்டு வழிகாட்டுதல்கள்...'
              }
              error={form.formState.errors.descriptionTa?.message}
              {...form.register('descriptionTa')}
            />
          </div>
        </div>

        {/* Section 2: Combo Builder (Multiple Products Selector) */}
        <ComboProductBuilder
          isCombo={isCombo}
          onToggleCombo={setIsCombo}
          comboItems={comboItems}
          onChangeComboItems={setComboItems}
          onApplyCalculatedPricing={handleApplyCalculatedPricing}
        />

        {/* Section 3: Media & Demo Video */}
        <ProductMediaManager media={mediaItems} onChange={setMediaItems} />

        {/* Section 4: Pricing & Stock */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            03. Pricing & Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="MRP Reference (₹) *"
              type="number"
              step="0.01"
              placeholder="100.00"
              error={form.formState.errors.mrp?.message}
              value={watchMrp !== undefined && watchMrp !== null && !isNaN(watchMrp) ? watchMrp : ''}
              onChange={(e) => handleMrpChange(parseFloat(e.target.value) || 0)}
            />

            <div>
              <Input
                label="Discount (%)"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 80"
                value={watchDiscount !== undefined && watchDiscount !== null && !isNaN(watchDiscount) ? watchDiscount : ''}
                onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {savingsAmount > 0 ? (
                  <span className="text-emerald-600 font-semibold">Saves ₹{savingsAmount.toFixed(2)} off MRP</span>
                ) : (
                  'Auto-computes Selling Price'
                )}
              </p>
            </div>

            <Input
              label="Selling Price (₹) *"
              type="number"
              step="0.01"
              placeholder="60.00"
              error={form.formState.errors.sellingPrice?.message}
              value={watchSellingPrice !== undefined && watchSellingPrice !== null && !isNaN(watchSellingPrice) ? watchSellingPrice : ''}
              onChange={(e) => handleSellingPriceChange(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Initial Warehouse Stock *"
              type="number"
              placeholder="100"
              error={form.formState.errors.stockQuantity?.message}
              {...form.register('stockQuantity', { valueAsNumber: true })}
            />

            <Input
              label="Low Stock Alert Level"
              type="number"
              placeholder="15"
              error={form.formState.errors.lowStockThreshold?.message}
              {...form.register('lowStockThreshold', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Section 5: Storefront Visibility */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            04. Storefront Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="rounded text-brand h-4 w-4"
                {...form.register('isActive')}
              />
              <div>
                <p className="text-xs font-medium text-foreground">Active in Store</p>
                <p className="text-[11px] text-muted-foreground">Visible to shoppers</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="rounded text-brand h-4 w-4"
                {...form.register('isFeatured')}
              />
              <div>
                <p className="text-xs font-medium text-foreground">Featured Highlight</p>
                <p className="text-[11px] text-muted-foreground">Show in Combos / Banners</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="rounded text-brand h-4 w-4"
                {...form.register('isBestseller')}
              />
              <div>
                <p className="text-xs font-medium text-foreground">Bestseller Badge</p>
                <p className="text-[11px] text-muted-foreground">Festive crowd favorite</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/products">
            <Button variant="outline" size="md" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="md"
            variant="primary"
            loading={submitting}
            className="font-medium"
          >
            {isCombo ? 'Create Combo Pack' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default withAdminShell(NewProductPageContent);

