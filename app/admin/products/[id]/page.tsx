'use client';

import { useEffect, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productUpdateSchema, type ProductUpdateInput } from '@/lib/validation/product';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const productId = parseInt(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const { data: productData, isLoading } = useQuery({
    queryKey: ['admin', 'products', 'detail', productId],
    queryFn: () => fetch(`/api/admin/products/${productId}`).then((r) => r.json()),
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
      form.reset({
        name: product.name,
        categoryId: product.categoryId,
        description: product.description || '',
        sku: product.sku || '',
        mrp: parseFloat(product.mrp),
        sellingPrice: parseFloat(product.sellingPrice),
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isBestseller: product.isBestseller,
      });
    }
  }, [product, form]);

  async function onSubmit(data: ProductUpdateInput) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.message || 'Failed to update product');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Product details updated successfully');
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
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16 bg-card rounded-3xl border border-border">
        <p className="font-bold text-lg">Product Not Found</p>
        <Link href="/admin/products" className="text-xs text-primary hover:underline mt-2 block">
          ← Back to Fireworks Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/80">
        <Link href="/admin/products">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Edit {product.name}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Internal ID: #{product.id} • SKU: {product.sku || 'N/A'}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-5">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            01. Product Information
          </h2>

          <Input
            label="Product Title *"
            placeholder="e.g. 10 cm Electric Sparklers"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category Collection *"
              defaultValue={String(product.categoryId)}
              options={categoriesList.map((c: { id: number; name: string }) => ({
                value: String(c.id),
                label: c.name,
              }))}
              error={form.formState.errors.categoryId?.message}
              onChange={(e) => form.setValue('categoryId', parseInt(e.target.value) || 0)}
            />

            <Input
              label="SKU / Factory Code (Optional)"
              placeholder="e.g. SPK-10CM-01"
              error={form.formState.errors.sku?.message}
              {...form.register('sku')}
            />
          </div>

          <Textarea
            label="Product Description & Safety"
            rows={4}
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-5">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            02. Pricing & Warehouse Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="MRP Reference (₹) *"
              type="number"
              step="0.01"
              error={form.formState.errors.mrp?.message}
              {...form.register('mrp', { valueAsNumber: true })}
            />

            <Input
              label="Selling / Wholesale Price (₹) *"
              type="number"
              step="0.01"
              error={form.formState.errors.sellingPrice?.message}
              {...form.register('sellingPrice', { valueAsNumber: true })}
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

        {/* Section 3: Flags */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-4">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            03. Storefront Visibility & Badges
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-primary h-4 w-4"
                {...form.register('isActive')}
              />
              <div>
                <p className="text-xs font-bold text-foreground">Active in Store</p>
                <p className="text-[10px] text-muted-foreground">Visible to shoppers</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-primary h-4 w-4"
                {...form.register('isFeatured')}
              />
              <div>
                <p className="text-xs font-bold text-foreground">Featured Highlight</p>
                <p className="text-[10px] text-muted-foreground">Show in Combos</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-primary h-4 w-4"
                {...form.register('isBestseller')}
              />
              <div>
                <p className="text-xs font-bold text-foreground">Bestseller Badge</p>
                <p className="text-[10px] text-muted-foreground">Festive favorite</p>
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
            className="font-bold shadow-md shadow-orange-500/25"
          >
            Update Product
          </Button>
        </div>
      </form>
    </div>
  );
}
