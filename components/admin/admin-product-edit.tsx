'use client';

import { useEffect, use, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productUpdateSchema, type ProductUpdateInput } from '@/lib/validation/product';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import Link from '@/components/ui/link';
import { toast } from 'sonner';
import { Portal } from '@/components/ui/portal';

import { ProductMediaManager } from '@/components/admin/product-media-manager';
import { ComboProductBuilder, type ComboItemEntry } from '@/components/admin/combo-product-builder';

import { withAdminShell } from './admin-shell';

function EditProductPageContent({
  params,
}: {
  params?: Promise<{ id: string }> | { id: string };
}) {
  const pathId = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean).pop() : '';
  const resolvedParams = typeof params === 'object' && params && 'then' in params ? use(params) : params;
  const id = resolvedParams?.id || pathId || '';
  const productId = parseInt(id, 10);
  const isValidProductId = !isNaN(productId) && productId > 0;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isCombo, setIsCombo] = useState(false);
  const [comboItems, setComboItems] = useState<ComboItemEntry[]>([]);

  const handleDeleteProduct = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to delete product');
      toast.success(resData.message || 'Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      window.location.href = '/admin/products';
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const { data: productData, isLoading } = useQuery({
    queryKey: ['admin', 'products', 'detail', productId],
    queryFn: () => fetch(`/api/admin/products/${productId}`).then((r) => r.json()),
    enabled: isValidProductId,
  });

  const { data: catData } = useQuery({
    queryKey: ['admin', 'categories', 'list'],
    queryFn: () => fetch('/api/admin/categories').then((r) => r.json()),
  });

  const product = productData?.product;
  const categoriesList = catData?.categories || [];

  const form = useForm<ProductUpdateInput>({
    resolver: zodResolver(productUpdateSchema),
  });

  useEffect(() => {
    if (product) {
      setIsCombo(Boolean(product.isCombo));
      if (product.comboItems && product.comboItems.length > 0) {
        setComboItems(
          product.comboItems.map((ci: any) => ({
            productId: ci.productId,
            quantity: ci.quantity,
            sortOrder: ci.sortOrder,
            product: ci.product,
          }))
        );
      } else {
        setComboItems([]);
      }

      const initialMrp = parseFloat(product.mrp);
      const initialPrice = parseFloat(product.sellingPrice);
      const initialDiscount =
        product.discountPercent !== undefined && product.discountPercent !== null
          ? product.discountPercent
          : initialMrp > 0
          ? Math.max(0, Math.round(((initialMrp - initialPrice) / initialMrp) * 100))
          : 0;

      form.reset({
        name: product.name,
        nameTa: product.nameTa || '',
        categoryId: product.categoryId,
        description: product.description || '',
        descriptionTa: product.descriptionTa || '',
        sku: product.sku || '',
        piecesPerBox: product.boxContent ?? product.piecesPerBox ?? 1,
        boxContent: product.boxContent ?? product.piecesPerBox ?? 1,
        contentUnit: product.contentUnit || 'Pcs',
        mrp: initialMrp,
        discountPercent: initialDiscount,
        sellingPrice: initialPrice,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isBestseller: product.isBestseller,
        isCombo: Boolean(product.isCombo),
      });
    }
  }, [product, form]);

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

  async function onSubmit(data: ProductUpdateInput) {
    if (data.sellingPrice !== undefined && data.mrp !== undefined && data.sellingPrice > data.mrp) {
      toast.error('Selling price cannot exceed MRP');
      return;
    }

    if (isCombo && comboItems.length === 0) {
      toast.error('Please add at least one product to this combo pack');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          isCombo,
          comboItems: isCombo
            ? comboItems.map((ci, idx) => ({
                productId: ci.productId,
                quantity: ci.quantity,
                sortOrder: idx,
              }))
            : [],
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.message || 'Failed to update product');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success(isCombo ? 'Combo product details updated successfully' : 'Product details updated successfully');
      router.push('/admin/products');
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border border-border">
        <p className="font-semibold text-base">Product not found</p>
        <Link href="/admin/products" className="text-xs text-brand hover:underline mt-2 block">
          Back to Fireworks Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Edit {product.name}
              </h1>
              {isCombo && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Combo Pack
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Internal ID: #{product.id} • SKU: {product.sku || 'N/A'}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          className="self-start sm:self-auto font-medium"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete Product
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            01. Product Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Title (English) *"
              placeholder="e.g. 10 cm Electric Sparklers"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />

            <Input
              label="Product Title (Tamil / தமிழ் பெயர்)"
              placeholder="எ.கா: 10 செ.மீ எலக்ட்ரிக் கம்பி மத்தாப்பு"
              error={form.formState.errors.nameTa?.message}
              {...form.register('nameTa')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label={isCombo ? 'Category Collection (Optional)' : 'Category Collection *'}
              defaultValue={product.categoryId ? String(product.categoryId) : ''}
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
              label="SKU / Factory Code (Optional)"
              placeholder="e.g. SPK-10CM-01"
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
              label="Product Description (English)"
              rows={4}
              error={form.formState.errors.description?.message}
              {...form.register('description')}
            />

            <Textarea
              label="Product Description (Tamil / தமிழ் விளக்கம்)"
              rows={4}
              placeholder="பட்டாசு விளக்கம், சிறப்பு அம்சங்கள் மற்றும் பயன்பாட்டு வழிகாட்டுதல்கள்..."
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
          excludeProductId={productId}
        />

        {/* Section 3: Media & Demo Video */}
        <ProductMediaManager productId={productId} media={product.media || []} />

        {/* Section 4: Pricing & Inventory */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            03. Pricing & Warehouse Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="MRP Reference (₹) *"
              type="number"
              step="0.01"
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
              error={form.formState.errors.sellingPrice?.message}
              value={watchSellingPrice !== undefined && watchSellingPrice !== null && !isNaN(watchSellingPrice) ? watchSellingPrice : ''}
              onChange={(e) => handleSellingPriceChange(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Warehouse Stock (Units) *"
              type="number"
              error={form.formState.errors.stockQuantity?.message}
              {...form.register('stockQuantity', { valueAsNumber: true })}
            />

            <Input
              label="Low Stock Warning Limit"
              type="number"
              error={form.formState.errors.lowStockThreshold?.message}
              {...form.register('lowStockThreshold', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Section 5: Flags */}
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
                <p className="text-[11px] text-muted-foreground">Show in Combos</p>
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
                <p className="text-[11px] text-muted-foreground">Festive favorite</p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
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
            Update Product
          </Button>
        </div>
      </form>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteDialogOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full p-6 space-y-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-foreground text-sm">Delete Product?</h3>
                <p className="text-xs text-muted-foreground">
                  Are you sure you want to delete <strong className="text-foreground">{product.name}</strong>?
                </p>
                {product.sku && (
                  <p className="font-mono text-[11px] text-muted-foreground">SKU: {product.sku}</p>
                )}
                <p className="text-[11px] text-muted-foreground/80 pt-1">
                  If this product has historical orders, it will be safely archived to preserve receipts and accounting data. Otherwise, it will be permanently deleted.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  onClick={handleDeleteProduct}
                  loading={deleting}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export default withAdminShell(EditProductPageContent);

