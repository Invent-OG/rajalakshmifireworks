'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/format';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface PreviewItem {
  id: number;
  name: string;
  mrp: number;
  currentPrice: number;
  newPrice: number;
  difference: number;
}

interface BulkProductItem {
  id: number;
  name: string;
  mrp: string | number;
  sellingPrice: string | number;
  category?: { name: string } | null;
}

interface CategoryOption {
  id: number;
  name: string;
}

export default function BulkPriceUpdatePage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [updateType, setUpdateType] = useState<
    'percentage_increase' | 'percentage_decrease' | 'fixed_amount' | 'direct_price'
  >('percentage_decrease');
  const [value, setValue] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewData, setPreviewData] = useState<PreviewItem[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ['admin', 'categories', 'list'],
    queryFn: () => fetch('/api/admin/categories').then((r) => r.json()),
  });

  const { data: prodData } = useQuery({
    queryKey: ['admin', 'products', 'list', { categoryId: selectedCategory }],
    queryFn: () => {
      const url = selectedCategory
        ? `/api/admin/products?categoryId=${selectedCategory}&limit=100`
        : `/api/admin/products?limit=100`;
      return fetch(url).then((r) => r.json());
    },
  });

  const productsList: BulkProductItem[] = prodData?.products || [];
  const categoriesList: CategoryOption[] = catData?.categories || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(productsList.map((p: BulkProductItem) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleProduct = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCalculatePreview = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    if (value <= 0) {
      toast.error('Please enter a valid positive value');
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch('/api/admin/products/bulk-price?preview=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedIds,
          updateType,
          value,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to calculate preview');
        return;
      }
      setPreviewData(data.preview || []);
    } catch {
      toast.error('Error generating preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/products/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedIds,
          updateType,
          value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to apply update');
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully updated ${data.updatedCount} products`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setPreviewData(null);
      setSelectedIds([]);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Link href="/admin/products">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Bulk Pricing Tool
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Apply percentage markdowns or adjustments across product groups.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Rule Settings */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              01. Scope & Category
            </h2>

            <Select
              label="Select Category Scope"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedIds([]);
                setPreviewData(null);
              }}
              options={[
                { value: '', label: 'All Fireworks Categories' },
                ...categoriesList.map((c: CategoryOption) => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              02. Adjustment Rule
            </h2>

            <Select
              label="Adjustment Strategy"
              value={updateType}
              onChange={(e) => {
                setUpdateType(
                  e.target.value as
                    | 'percentage_increase'
                    | 'percentage_decrease'
                    | 'fixed_amount'
                    | 'direct_price'
                );
                setPreviewData(null);
              }}
              options={[
                { value: 'percentage_decrease', label: 'Percentage Discount (e.g. -15%)' },
                { value: 'percentage_increase', label: 'Percentage Increase (e.g. +10%)' },
                { value: 'fixed_amount', label: 'Fixed Price Increase (+₹)' },
                { value: 'direct_price', label: 'Set Exact Price (₹)' },
              ]}
            />

            <Input
              label={
                updateType.startsWith('percentage') ? 'Adjustment Rate (%)' : 'Amount in INR (₹)'
              }
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => {
                setValue(parseFloat(e.target.value) || 0);
                setPreviewData(null);
              }}
            />

            <Button
              className="w-full font-medium"
              variant="primary"
              onClick={handleCalculatePreview}
              loading={previewLoading}
              disabled={selectedIds.length === 0}
            >
              Preview Calculated Prices ({selectedIds.length})
            </Button>
          </div>
        </div>

        {/* Right Side: Product Selector & Preview */}
        <div className="lg:col-span-8">
          {previewData ? (
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h2 className="font-bold text-base text-foreground">
                    Previewing Calculated Prices
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review adjusted selling prices before committing to the database.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewData(null)}>
                    Back
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="font-medium"
                    loading={applyMutation.isPending}
                    onClick={() => {
                      if (
                        confirm(
                          `Confirm updating ${previewData.length} products with rule "${updateType.replace(
                            '_',
                            ' '
                          )}" of ${value}?`
                        )
                      ) {
                        applyMutation.mutate();
                      }
                    }}
                  >
                    Commit {previewData.length} Updates
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-card border-b border-border text-[11px] uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">MRP</th>
                      <th className="px-4 py-3">Current</th>
                      <th className="px-4 py-3 font-semibold text-foreground">New Selling</th>
                      <th className="px-4 py-3">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewData.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatCurrency(item.mrp)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatCurrency(item.currentPrice)}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {formatCurrency(item.newPrice)}
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            item.difference >= 0 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {item.difference > 0 ? '+' : ''}
                          {formatCurrency(item.difference)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      productsList.length > 0 && selectedIds.length === productsList.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-brand h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    Select All in Scope ({productsList.length})
                  </span>
                </label>
                <span className="text-xs font-medium text-muted-foreground">
                  {selectedIds.length} items checked
                </span>
              </div>

              <div className="overflow-x-auto max-h-[550px]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-card border-b border-border text-[11px] uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 w-8"></th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Selling Price</th>
                      <th className="px-4 py-3">MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {productsList.map((p: BulkProductItem) => (
                      <tr
                        key={p.id}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => handleToggleProduct(p.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => {}}
                            className="rounded text-brand h-4 w-4"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.category?.name || '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {formatCurrency(p.sellingPrice)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground line-through">
                          {formatCurrency(p.mrp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
