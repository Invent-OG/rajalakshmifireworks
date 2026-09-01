'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import { Search, Plus, Edit, Archive, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductListItem {
  id: number;
  name: string;
  sku: string | null;
  mrp: string | number;
  sellingPrice: string | number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  category: { id: number; name: string } | null;
  media: Array<{ url: string }>;
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.products.list({ page, search }),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      return fetch(`/api/admin/products?${params}`).then((r) => r.json());
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to archive product');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all });
      toast.success('Product archived successfully');
    },
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination ?? { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Products</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your store fireworks, stock levels, pricing, and media.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/products/bulk-price">
            <Button variant="outline" size="md" className="font-medium text-xs">
              <DollarSign className="h-4 w-4 text-muted-foreground" /> Bulk Price Tool
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button variant="primary" size="md" className="font-semibold text-xs">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-card border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-muted/30 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all"
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {pagination.total} products listed
        </span>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">MRP</th>
                  <th className="px-5 py-3 text-right">Selling Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p: ProductListItem) => {
                  const stock = p.stockQuantity;
                  const stockStatus =
                    stock <= 0
                      ? 'OUT_OF_STOCK'
                      : stock <= p.lowStockThreshold
                      ? 'LOW_STOCK'
                      : 'IN_STOCK';
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                            {p.media?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.media[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ProductVisualPlaceholder name={p.category?.name || p.name} className="w-full h-full text-[10px]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{p.name}</p>
                            {p.sku && (
                              <p className="text-[11px] font-mono text-muted-foreground">{p.sku}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-medium">
                        {p.category?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground line-through">
                        {formatCurrency(p.mrp)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground text-right">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-foreground">{stock} units</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={stockStatus} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/${p.id}`}>
                            <Button variant="ghost" size="icon-sm" aria-label="Edit product">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Archive product"
                            onClick={() => {
                              if (confirm(`Archive "${p.name}"? It will no longer show in the storefront.`)) {
                                archiveMutation.mutate(p.id);
                              }
                            }}
                          >
                            <Archive className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-8">
          <p className="text-sm font-semibold text-foreground">No fireworks found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click &ldquo;Add Product&rdquo; above to create your first item.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-medium text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
