'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Fireworks Catalog</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your store crackers, stock levels, wholesale pricing, and media.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/products/bulk-price">
            <Button variant="outline" size="md" className="font-semibold text-xs">
              <DollarSign className="h-4 w-4 text-amber-500" /> Bulk Price Tool
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button variant="primary" size="md" className="font-bold text-xs shadow-md shadow-orange-500/25">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-card border border-border/80 luxury-card">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cracker name, SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-border bg-muted/40 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {pagination.total} Fireworks Listed
        </span>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="rounded-3xl bg-card border border-border/80 luxury-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">MRP</th>
                  <th className="px-5 py-3.5">Selling Price</th>
                  <th className="px-5 py-3.5">Stock</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
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
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-xl shrink-0 overflow-hidden border border-border/60">
                            {p.media?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.media[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              '🎆'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{p.name}</p>
                            {p.sku && (
                              <p className="text-[11px] font-mono text-muted-foreground">{p.sku}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-muted-foreground">
                        {p.category?.name ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground line-through">
                        {formatCurrency(p.mrp)}
                      </td>
                      <td className="px-5 py-4 font-black text-foreground">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="px-5 py-4 font-bold text-foreground">{stock} units</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={stockStatus} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
        <div className="text-center py-16 bg-card rounded-3xl border border-border/80 p-8 luxury-card">
          <p className="text-base font-bold text-foreground">No fireworks found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click &ldquo;Add Product&rdquo; above to create your first item.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-semibold text-muted-foreground">
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
