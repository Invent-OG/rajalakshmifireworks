'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productBaseSchema, type ProductBaseInput } from '@/lib/validation/product';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ['admin', 'categories', 'list'],
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
      mrp: 0,
      sellingPrice: 0,
      stockQuantity: 50,
      lowStockThreshold: 10,
      isActive: true,
      isFeatured: false,
      isBestseller: false,
    },
  });

  async function onSubmit(data: ProductBaseInput) {
    if (data.sellingPrice > data.mrp) {
      toast.error('Selling price cannot exceed MRP');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.message || 'Failed to create product');
        return;
      }

      toast.success('Product created successfully');
      router.push('/admin/products');
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Add New Fireworks Product
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create a new cracker item in your Sivakasi catalog.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Info */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-5">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            01. Product Information
          </h2>

          <Input
            label="Product Title *"
            placeholder="e.g. 10 cm Electric Sparklers (10 pcs)"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category Collection *"
              placeholder="Select Category"
              options={categoriesList.map((c: { id: number; name: string }) => ({
                value: String(c.id),
                label: c.name,
              }))}
              error={form.formState.errors.categoryId?.message}
              onChange={(e) => form.setValue('categoryId', parseInt(e.target.value) || 0)}
            />

            <Input
              label="SKU / Factory Code (Optional)"
              placeholder="e.g. SPK-10CM-ELEC"
              error={form.formState.errors.sku?.message}
              {...form.register('sku')}
            />
          </div>

          <Textarea
            label="Product Details & Safety Notes"
            placeholder="Describe the sparks, sound level, duration, and packaging..."
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />
        </div>

        {/* Section 2: Pricing & Stock */}
        <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card space-y-5">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
            02. Pricing & Warehouse Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="MRP Reference (₹) *"
              type="number"
              step="0.01"
              placeholder="100.00"
              error={form.formState.errors.mrp?.message}
              {...form.register('mrp', { valueAsNumber: true })}
            />

            <Input
              label="Selling / Wholesale Price (₹) *"
              type="number"
              step="0.01"
              placeholder="60.00"
              error={form.formState.errors.sellingPrice?.message}
              {...form.register('sellingPrice', { valueAsNumber: true })}
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
              label="Low Stock Warning Limit"
              type="number"
              placeholder="15"
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
                <p className="text-[10px] text-muted-foreground">Show in Combos & Boxes</p>
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
                <p className="text-[10px] text-muted-foreground">Festive crowd favorite</p>
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
            className="font-bold shadow-md shadow-orange-500/25"
          >
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}
